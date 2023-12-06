import React, { createRef } from 'react';
import PropTypes from 'prop-types';
import { ParamDefinition } from 'molstar/lib/mol-util/param-definition';
import { CameraHelperParams } from 'molstar/lib/mol-canvas3d/helper/camera-helper';
import { Viewer } from './viewer';

import 'molstar/build/viewer/molstar.css';

class Molstar extends React.Component {

  constructor(props) {
    super(props);
    this.parentRef = "main";
    this.plugin = null;
  }

  componentDidMount() {
    const { receptorFile, ligandFile, gtLigandFile, gtLigandFiles } = this.props;
    const files = [receptorFile, ligandFile]
    gtLigandFile && files.push(gtLigandFile)
    console.log(gtLigandFiles)
    if (gtLigandFiles) {
      for (let gtFile of gtLigandFiles) {
        files.push(gtFile)
      }
    }
    Viewer.create(this.parentRef, {
      layoutIsExpanded: false,
      viewportShowAnimation: false,
    }).then(res => {
      this.plugin = res.plugin;
      window.molstarPlugin = this.plugin;
      Viewer.loadStructuresFromUrlsAndMerge(files, this.plugin);
      if (this.plugin && this.plugin.canvas3d) {
        this.plugin.canvas3d.setProps({ camera: { helper: {
          axes: ParamDefinition.getDefaultValues(CameraHelperParams).axes
        } } });
      }
    });
  }

  componentWillUnmount() {
    this.plugin && this.plugin.clear && this.plugin.clear();
  }

  render() {
    return (
      <div style={{ position: "absolute", width: '100%', height: this.props.height, overflow: "hidden" }}>
        <div ref={this.parentRef} style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0 }} />
      </div>
    )
  }
}

Molstar.propTypes = {
  receptorFile: PropTypes.object,
  ligandFile: PropTypes.object,
  gtLigandFile: PropTypes.object,
  gtLigandFiles: PropTypes.array,

  // More
  width: PropTypes.string,
  height: PropTypes.string,
};

export default Molstar;