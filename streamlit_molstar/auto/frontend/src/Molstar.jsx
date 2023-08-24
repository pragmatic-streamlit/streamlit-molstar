import PropTypes from "prop-types";
import { useEffect, useRef } from "react";
import "@dp-launching/molstar/lib/mol-plugin-ui/skin/light.scss";
import { Viewer, ExtensionMap } from '@dp-launching/molstar/build/viewer/molstar';
import { ObjectKeys } from '@dp-launching/molstar/lib/mol-util/type-helpers';
import { getFileNameInfo } from '@dp-launching/molstar/lib/mol-util/file-info';
import { type } from "os";


const Molstar = props => {

  const {
    height = '100%', width = '100%', files = []
  } = props;

  const parentRef = useRef(null);

  useEffect(() => {
    async function init() {
        delete ExtensionMap['volseg'];
        const viewer = await Viewer.create(parentRef.current, {
          extensions: ObjectKeys(ExtensionMap),
          layoutIsExpanded: false,
          layoutShowControls: false,
          viewportShowExpand: false,
        })        
        for (const file of files) {
          var format;
          var dataformat;
          var isBinary = false;
          var source = "url";

          if (typeof file !== 'string') { 
            format = file.format;
            if (file.isBinary != undefined) {
              isBinary = file.isBinary;
            }
            if (file.url == undefined) {
              file = file.data;
              source = "data";
            } else {
              file = file.url;
            }
            dataformat = viewer.plugin.dataFormats.get(format);
          } else {
            const info = getFileNameInfo(file);
            format = info.ext;
            const stringTypes = viewer.plugin.dataFormats._list.filter(i => i.provider.stringExtensions != null && i.provider.stringExtensions.includes(info.ext))
            const binaryTypes = viewer.plugin.dataFormats._list.filter(i => i.provider.binaryExtensions != null && i.provider.binaryExtensions.includes(info.ext))
            if (stringTypes.length > 0) {
              dataformat = stringTypes[0];
              format = stringTypes[0].name;
            } else if (binaryTypes.length > 0) {
              dataformat = binaryTypes[0];
              format = binaryTypes[0].name;
              isBinary = true;
            }
          }

          var category = "Trajectory";
          if (dataformat != undefined) {
            category = dataformat.provider.category;
          }
          if (category == "Volume") {
            await viewer.loadVolumeFromUrl(
              {
                url: file, 
                format: format,
                isBinary: isBinary,
              }, [{
                type: 'relative',
                value: 1,
                alpha: 0.5,
                color: 0xffffff,
            }]
            );
          } else if (category == "Trajectory") {
            if (source == "data") {
              await viewer.loadStructureFromData(file, format, isBinary)
            } else {
              await viewer.loadStructureFromUrl(file, format, isBinary)
            }
          } else if (category == "Coordinates") {
          } else if (category == "Topology") {
          }
        }
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
  files: PropTypes.array,
};

export default Molstar;