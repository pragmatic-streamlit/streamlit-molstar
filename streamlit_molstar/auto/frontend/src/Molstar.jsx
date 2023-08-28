import PropTypes from "prop-types";
import { useEffect, useRef } from "react";
import "@dp-launching/molstar/lib/mol-plugin-ui/skin/light.scss";
import { Viewer, ExtensionMap } from '@dp-launching/molstar/build/viewer/molstar';
import { ObjectKeys } from '@dp-launching/molstar/lib/mol-util/type-helpers';
import { getFileNameInfo } from '@dp-launching/molstar/lib/mol-util/file-info';

function get_url_from_data(data, isBinary) {
  var blob;
  if (isBinary){
    const sliceSize = 512;
    const byteCharacters = data;
    const byteArrays = [];
  
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
  
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
  
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    blob = new Blob(byteArrays, {type: "application/octet-stream"});
  } else {
    blob = new Blob([data], {type: 'text/plain'});
  }
  return URL.createObjectURL(blob);
}

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
        for (var file of files) {
          var format = file.format;
          var source = file.source;
          var options = file.options;
          var isBinary = false;

          var dataformat = undefined;

          const info = getFileNameInfo(file.name);
          if (format === "auto") {
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
          } else {
            dataformat = viewer.plugin.dataFormats.get(format);
            isBinary = viewer.plugin.dataFormats.binaryExtensions.has(info.ext);
          }

          if (source === "data") {
            file.url = get_url_from_data(atob(file.data), isBinary);
          }

          var category = "Trajectory";
          if (dataformat != undefined) {
            category = dataformat.provider.category;
          }
          if (category == "Volume") {    
            await viewer.loadVolumeFromUrl(
              {
                url: file.url, 
                format: format,
                isBinary: isBinary,
              }, [{
                type: 'absolute',
                value: file.options?.isoValue ?? 0.5,
                alpha: 0.7,
                color: 0xffffff,
            }]
            );
          } else if (category == "Trajectory") {
            await viewer.loadStructureFromUrl(file.url, format, isBinary)
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