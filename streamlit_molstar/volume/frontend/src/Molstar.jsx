import PropTypes from "prop-types";
import { useEffect, useRef } from "react";
import { createPluginUI } from "@dp-launching/molstar/lib/mol-plugin-ui";
import { PluginConfig } from "@dp-launching/molstar/lib/mol-plugin/config";
import { DefaultPluginUISpec } from "@dp-launching/molstar/lib/mol-plugin-ui/spec";
import "@dp-launching/molstar/lib/mol-plugin-ui/skin/light.scss";
import {Viewer} from '@dp-launching/molstar/lib/apps/viewer/app';


const Molstar = props => {

  const {
    height = '100%', width = '100%'
  } = props;

  const parentRef = useRef(null);

  useEffect(() => {
    async function init() {
        const spec = DefaultPluginUISpec();
        spec.layout = {
          initial: {
            isExpanded: false,
            controlsDisplay: "reactive",
            showControls: false,
            showLog: false,
            showSettings: false,
          },
        };
        spec.config = [
          [PluginConfig.Viewport.ShowExpand, false],
          [PluginConfig.Viewport.ShowControls, true],
          [PluginConfig.Viewport.ShowSettings, true],
          [PluginConfig.Viewport.ShowSelectionMode, true],
          [PluginConfig.Viewport.ShowAnimation, false],
          [PluginConfig.Viewport.ShowTrajectoryControls, false],
          [PluginConfig.Viewport.showLog, false],
        ];


        window.molstar = await createPluginUI(parentRef.current, spec);
        console.log(window.molstar);
        const viewer = new Viewer(window.molstar);
        //viewer.loadPdb("3PTB");

        // const data = await window.molstar.builders.data.download(
        //   { url: "https://files.rcsb.org/download/3PTB.pdb" }, /* replace with your URL */
        //   { state: { isGhost: true } }
        // );
        // const trajectory =
        //   await window.molstar.builders.structure.parseTrajectory(data, "pdb");
        // await window.molstar.builders.structure.hierarchy.applyPreset(
        //   trajectory,
        //   "default"
        // );

        // console.log(window.molstar);

        // const data2 = await window.molstar.builders.data.download(
        //   { url: "https://files.rcsb.org/download/7QO7.pdb" }, /* replace with your URL */
        //   { state: { isGhost: true } }
        // );
        // const trajectory2 =
        //   await window.molstar.builders.structure.parseTrajectory(data2, "pdb");
        // await window.molstar.builders.structure.hierarchy.applyPreset(
        //   trajectory2,
        //   "default2"
        // );
    }
    init();
    return () => {
      window.molstar?.dispose();
      window.molstar = undefined;
    };
  }, []);

  return (
    <div style={{ position: "absolute", width, height, overflow: "hidden" }}>
      <div ref={parentRef} style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0 }} />
    </div>
  )
};


Molstar.propTypes = {
  width: PropTypes.string,
  height: PropTypes.string,
};

export default Molstar;