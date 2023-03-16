import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { DefaultPluginUISpec } from "molstar/lib/mol-plugin-ui/spec";
import { createPluginAsync } from "molstar/lib/mol-plugin-ui/index";

import { TrajectoryFromModelAndCoordinates } from 'molstar/lib/mol-plugin-state/transforms/model';
import { StateTransforms } from 'molstar/lib/mol-plugin-state/transforms';
import { PluginConfig } from "molstar/lib/mol-plugin/config";
import "molstar/build/viewer/molstar.css";
import { ParamDefinition } from "molstar/lib/mol-util/param-definition";
import { CameraHelperParams } from "molstar/lib/mol-canvas3d/helper/camera-helper";


export const addTrajectory = async (plugin, params) => {
  const { kind, url, format, isBinary } = params;
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


const Molstar = props => {

  const {
    modelFile, trajFile,
    height = '100%', width = '100%',
    showAxes = true,
    defaultShowControls = false,
    showExpand = true, showControls = true, showSettings = true, showSelectionMode = true, showAnimation = false, showTrajectoryControls = true
  } = props;
  const parentRef = useRef(null);
  const canvasRef = useRef(null);
  const plugin = useRef(null);

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
        [PluginConfig.Viewport.ShowAnimation, showAnimation],
        [PluginConfig.Viewport.ShowTrajectoryControls, showTrajectoryControls],
      ];
      plugin.current = await createPluginAsync(parentRef.current, spec);

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
      await loadStructure(modelFile, trajFile, plugin.current);
    })();
    return () => plugin.current = null;
  }, [])


  useEffect(() => {
    loadStructure(modelFile, trajFile, plugin.current);
  }, [modelFile, trajFile])


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
      } else if (modelFile.data) {
        const data = await plugin.builders.data.rawData({
          data: modelFile.data
        });
        const traj = await plugin.builders.structure.parseTrajectory(data, modelFile.format);
        await plugin.builders.structure.hierarchy.applyPreset(traj, "default");
      } else {
        const data = await plugin.builders.data.download(
          { url: modelFile.url }, { state: { isGhost: true } }
        );
        let extension = modelFile.format.replace("cif", "mmcif");
        const traj = await plugin.builders.structure.parseTrajectory(data, extension);
        await plugin.builders.structure.hierarchy.applyPreset(traj, "default");
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