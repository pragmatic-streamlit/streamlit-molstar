import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { DefaultPluginUISpec } from "@dp-launching/molstar/lib/mol-plugin-ui/spec";
import { QualityAssessmentPLDDTPreset, QualityAssessmentQmeanPreset } from '@dp-launching/molstar/lib/extensions/model-archive/quality-assessment/behavior';
import { QualityAssessment } from '@dp-launching/molstar/lib/extensions/model-archive/quality-assessment/prop';
import { TrajectoryFromModelAndCoordinates } from '@dp-launching/molstar/lib/mol-plugin-state/transforms/model';
import { StateTransforms } from '@dp-launching/molstar/lib/mol-plugin-state/transforms';
import { PluginConfig } from "@dp-launching/molstar/lib/mol-plugin/config";
import "@dp-launching/molstar/build/viewer/molstar.css";
import { ParamDefinition } from "@dp-launching/molstar/lib/mol-util/param-definition";
import { CameraHelperParams } from "@dp-launching/molstar/lib/mol-canvas3d/helper/camera-helper";
import { OpenFiles } from '@dp-launching/molstar/lib/mol-plugin-state/actions/file';
import { Asset } from '@dp-launching/molstar/lib/mol-util/assets';
import { PresetStructureRepresentations, StructureRepresentationPresetProvider } from '@dp-launching/molstar/lib/mol-plugin-state/builder/structure/representation-preset';
import { StateObjectRef } from '@dp-launching/molstar/lib/mol-state';
import { presetStaticComponent } from '@dp-launching/molstar/lib/mol-plugin-state/builder/structure/representation-preset';

import { Material } from '@dp-launching/molstar/lib/mol-util/material';

import { createPluginUI } from './create-plugin-ui';
const CustomMaterial = Material({ roughness: 0.2, metalness: 0 });
const PresetParams = {
  ...StructureRepresentationPresetProvider.CommonParams,
};


function get_url_from_data(data, isBinary) {
  var blob;
  if (isBinary){
    blob = new Blob([data], {type: 'application/octet-stream'});
  } else {
    blob = new Blob([data], {type: 'text/plain'});
  }
  return URL.createObjectURL(blob);
}

export const addTrajectory = async (plugin, params) => {
  if (!plugin) return;
  let model;
  let coords;
  if (params.model.kind === 'model-data' || params.model.kind === 'model-url') {
    const data =
      params.model.kind === 'model-data'
        ? await plugin.builders.data.rawData({ data: params.model.data, label: params.modelLabel })
        : await plugin.builders.data.download({
          url: params.model.url,
          isBinary: params.model.isBinary,
          label: params.modelLabel,
        });

    const trajectory = await plugin.builders.structure.parseTrajectory(data, params.model.format ?? 'mmcif');
    model = await plugin.builders.structure.createModel(trajectory);
  } else {
    const data =
      params.model.kind === 'topology-data'
        ? await plugin.builders.data.rawData({ data: params.model.data, label: params.modelLabel })
        : await plugin.builders.data.download({
          url: params.model.url,
          isBinary: params.model.isBinary,
          label: params.modelLabel,
        });

    const provider = plugin.dataFormats.get(params.model.format);
    model = await provider.parse(plugin, data);
  }
  {
    // FIXME coordinates-data is not supported
    if (params.coordinates.kind === 'coordinates-data'){
      params.coordinates.url = get_url_from_data(params.coordinates.data, params.coordinates.isBinary);
      params.coordinates.kind = 'coordinates-url';
    }
    const data =
      params.coordinates.kind === 'coordinates-data'
        ? await plugin.builders.data.rawData({
          data: params.coordinates.data,
          label: params.coordinatesLabel,
        })
        : await plugin.builders.data.download({
          url: params.coordinates.url,
          isBinary: params.coordinates.isBinary,
          label: params.coordinatesLabel,
        });

    const provider = plugin.dataFormats.get(params.coordinates.format);
    coords = await provider.parse(plugin, data);
  }
  const trajectory = await plugin
    .build()
    .toRoot()
    .apply(
      TrajectoryFromModelAndCoordinates,
      {
        modelRef: model.ref,
        coordinatesRef: coords.ref,
      },
      { dependsOn: [model.ref, coords.ref] }
    )
    .apply(StateTransforms.Model.ModelFromTrajectory, { modelIndex: 0 })
    .commit();
  const structure = await plugin.builders.structure.createStructure(trajectory);
  await plugin.builders.structure.representation.applyPreset(structure, 'auto');
};

const InteractionsPreset = StructureRepresentationPresetProvider({
  id: 'preset-interactions',
  display: { name: 'Interactions' },
  params: () => PresetParams,
  async apply(ref, params, plugin) {
      const structureCell = StateObjectRef.resolveAndCheck(plugin.state.data, ref);
      const structure = structureCell?.obj?.data;
      if (!structureCell || !structure) return {};

      const components = {
          ligand: await presetStaticComponent(plugin, structureCell, 'all'),
          interactions: await presetStaticComponent(plugin, structureCell, 'all'),
      };

      const { update, builder, typeParams } = StructureRepresentationPresetProvider.reprBuilder(plugin, params);
      const representations = {
          ligand: builder.buildRepresentation(update, components.ligand, { type: 'ball-and-stick', typeParams: { ...typeParams, material: CustomMaterial, sizeFactor: 0.3 }, color: 'element-symbol', colorParams: { carbonColor: { name: 'element-symbol', params: {} } } }, { tag: 'all' }),
      };

      await update.commit({ revertOnError: true });
      plugin.managers.interactivity.setProps({ granularity: 'element' });

      return { components, representations };
  }
});

const ViewerAutoPreset = StructureRepresentationPresetProvider({
  id: 'preset-structure-representation-viewer-auto',
  display: {
    name: 'Automatic (w/ Annotation)', group: 'Annotation',
    description: 'Show standard automatic representation but colored by quality assessment (if available in the model).'
  },
  isApplicable(a) {
    return (
      !!a.data.models.some(m => QualityAssessment.isApplicable(m, 'pLDDT')) ||
      !!a.data.models.some(m => QualityAssessment.isApplicable(m, 'qmean'))
    );
  },
  params: () => StructureRepresentationPresetProvider.CommonParams,
  async apply(ref, params, plugin) {
    const structureCell = StateObjectRef.resolveAndCheck(plugin.state.data, ref);
    const structure = structureCell && structureCell.obj && structureCell.obj.data;
    const nmodels = structure.state.models[0].sourceData.data.structures? structure.state.models[0].sourceData.data.structures.length: structure.state.models[0].modelNum;
    if (nmodels > 1){
      plugin.config.set("viewer.show-animation-button", true);
    } else {
      plugin.config.set("viewer.show-animation-button", false);
      plugin.managers.animation._animations.length = [];
    }

    if (!structureCell || !structure) return {};
    
    if (structure.model.sourceData.kind === 'gro'){
      return await InteractionsPreset.apply(ref, params, plugin);
      
    } else if (structure.models.some(m => QualityAssessment.isApplicable(m, 'pLDDT'))) {
      return await QualityAssessmentPLDDTPreset.apply(ref, params, plugin);
    } else if (structure.models.some(m => QualityAssessment.isApplicable(m, 'qmean'))) {
      return await QualityAssessmentQmeanPreset.apply(ref, params, plugin);
    } else {
      return await PresetStructureRepresentations.auto.apply(ref, params, plugin);
    }
  }
});


const Molstar = props => {

  const {
    modelFile, modelFiles, trajFile,
    height = '100%', width = '100%',
    showAxes = true,
    defaultShowControls = false,
    showExpand = true, showControls = true, showSettings = true, showSelectionMode = true, showAnimation = false, showTrajectoryControls = true
  } = props;
  const parentRef = useRef(null);
  const canvasRef = useRef(null);
  const plugin = useRef(null);

  console.log("modelFile", modelFile);
  console.log("modelFiles", modelFiles);
  console.log("trajFile", trajFile);

  useEffect(() => {
    (async () => {
      const spec = DefaultPluginUISpec();
      spec.layout = {
        initial: {
          isExpanded: false,
          controlsDisplay: "reactive",
          showControls: defaultShowControls,
        },
      };
      spec.config = [
        [PluginConfig.Viewport.ShowExpand, showExpand],
        [PluginConfig.Viewport.ShowControls, showControls],
        [PluginConfig.Viewport.ShowSettings, showSettings],
        [PluginConfig.Viewport.ShowSelectionMode, showSelectionMode],
        [PluginConfig.Viewport.ShowAnimation, true],
        [PluginConfig.Structure.DefaultRepresentationPreset, ViewerAutoPreset.id],
        [PluginConfig.Viewport.ShowTrajectoryControls, showTrajectoryControls],
      ];
      if (modelFile?.format === "gro" || trajFile?.format === "gro") {
        spec.behaviors = spec.behaviors.filter(behavior => (behavior.transformer.definition.name !== "create-structure-focus-representation"));
      }
      plugin.current = await createPluginUI(parentRef.current, spec, {
        onBeforeUIRender: plugin => {
            // the preset needs to be added before the UI renders otherwise
            // "Download Structure" wont be able to pick it up
            plugin.builders.structure.representation.registerPreset(ViewerAutoPreset);
        }
      });
      if (!showAxes) {
        // eslint-disable-next-line
        plugin.current.canvas3d?.setProps({
          camera: {
            helper: {
              axes: {
                name: "off", params: {}
              }
            }
          }
        });
      }
      if (modelFile) {
        await loadStructure(modelFile, trajFile, plugin.current);
      }
      else if (modelFiles && modelFiles.length > 0) {
        await loadMultiple(modelFiles, plugin.current);
      }
    })();
    return () => plugin.current = null;
  }, [])


  useEffect(() => {
    loadStructure(modelFile, trajFile, plugin.current);
  }, [modelFile, trajFile])


  useEffect(() => {
    
    if (modelFiles && modelFiles.length > 0) {
      loadMultiple(modelFiles, plugin.current);
    }
  }, [modelFiles])


  useEffect(() => {
    if (plugin.current) {
      if (!showAxes) {
        // eslint-disable-next-line
        plugin.current.canvas3d?.setProps({
          camera: {
            helper: {
              axes: {
                name: "off", params: {}
              }
            }
          }
        })
      } else {
        // eslint-disable-next-line
        plugin.current.canvas3d?.setProps({
          camera: {
            helper: {
              axes: ParamDefinition.getDefaultValues(CameraHelperParams).axes
            }
          }
        })
      }
    }
  }, [showAxes])

  
  const loadMultiple = async (modelFiles, plugin) => {
    if (plugin) {
      plugin.clear();
      const assets = modelFiles.map((modelFile) => {
        if (modelFile.data && typeof modelFile.data === "string") {
          return Asset.File(new File([modelFile.data], modelFile.name));
        }
      }
      );
      const a = await plugin.runTask(plugin.state.data.applyAction(OpenFiles, {
        files: assets,
          format: { name: 'auto', params: {} },
          visuals: true
      }));
    }
  }


  const loadStructure = async (modelFile, trajFile, plugin) => {
    if (plugin) {
      plugin.clear();
      if (trajFile) {

        await addTrajectory(plugin, {
          model: {
            kind: (modelFile.url ? 'model-url' : 'model-data'),
            url: (modelFile.url ? modelFile.url : undefined),
            data: (modelFile.data ? modelFile.data : undefined),
            format: modelFile.format,
          },
          
          coordinates: {
            kind: (trajFile.url ? 'coordinates-url' : 'coordinates-data'),
            url: (trajFile.url ? trajFile.url : undefined),
            data: (trajFile.data ? trajFile.data : undefined),
            format: trajFile.format,
            isBinary: true,
          },
          preset: 'all-models',
        });
      } else if (modelFile.data && typeof modelFile.data === "string") {
        const asset = Asset.File(new File([modelFile.data], modelFile.name));
        // const data = await OpenFiles(plugin, {
        //   files: [asset],
        //    format: { name: 'auto', params: {} },
        //    visuals: true
        // });
        //PluginCommands.State.Snapshots.OpenFile(plugin, { file: new File([modelFile.data], modelFile.name)});
        const a = await plugin.runTask(plugin.state.data.applyAction(OpenFiles, {
          files: [asset],
           format: { name: 'auto', params: {} },
           visuals: true
        })); 
      } else {
        const data = await plugin.builders.data.download(
          { url: modelFile.url }, { state: { isGhost: true } }
        );
        const asset = Asset.File(new File([data.obj.data], modelFile.name));
        plugin.runTask(plugin.state.data.applyAction(OpenFiles, {
          files: [asset],
            format: { name: 'auto', params: {} },
            visuals: true
        })); 
      }
    }
  }
  return (
    <div style={{ position: "absolute", width, height, overflow: "hidden" }}>
      <div ref={parentRef} style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0 }} />
    </div>
  )
};

Molstar.propTypes = {
  modelFile: PropTypes.object,
  modelFiles: PropTypes.array,
  trajFile: PropTypes.object,

  // Viz Control
  showAxes: PropTypes.bool,
  showControls: PropTypes.bool,
  showExpand: PropTypes.bool,
  showAnimation: PropTypes.bool,
  showSettings: PropTypes.bool,
  showSelectionMode: PropTypes.bool,
  showTrajectoryControls: PropTypes.bool,
  defaultShowControls: PropTypes.bool,

  // More
  width: PropTypes.string,
  height: PropTypes.string,
};

export default Molstar;