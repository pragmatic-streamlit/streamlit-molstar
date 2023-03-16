import { createElement } from 'react';
import ReactDOM from 'react-dom';
import { Plugin } from 'molstar/lib/mol-plugin-ui/plugin';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { DefaultPluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';

const createPluginUI = async (target, spec, options) => {
  const ctx = new PluginUIContext(spec || DefaultPluginUISpec());
  await ctx.init();
  if (options && options.onBeforeUIRender) {
    await options.onBeforeUIRender(ctx);
  }
  ReactDOM.render(createElement(Plugin, { plugin: ctx }), target);
  try {
    await ctx.canvas3dInitialized;
  } catch {
    // Error reported in UI/console elsewhere.
  }
  return ctx;
};

export { createPluginUI };