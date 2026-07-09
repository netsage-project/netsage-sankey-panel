// Jest setup provided by Grafana scaffolding
import '../.config/jest-setup';

// jsdom does not implement a few web globals that importing @grafana/ui needs at module load:
// it transitively loads react-dom's server renderer (via TruncatedText), whose scheduler
// references MessageChannel, TextEncoder and TextDecoder. Polyfill them from Node's core modules
// so component tests that touch @grafana/ui (Tooltip, Sankey, SankeyPanel) can import it. Each is
// a safe no-op when the environment already provides one.

// React's scheduler picks its work-scheduling primitive at module load, preferring `setImmediate`
// and only falling back to `MessageChannel`. jest-environment-jsdom does not expose setImmediate,
// so without this the scheduler builds a MessageChannel out of the polyfill below. A
// worker_threads MessagePort is a real libuv handle that is never closed, so Jest hangs at the end
// of the run ("A worker process has failed to exit gracefully"). Restoring setImmediate keeps the
// scheduler off MessageChannel entirely; setImmediate callbacks do not hold the event loop open.
if (typeof global.setImmediate === 'undefined') {
  global.setImmediate = (fn, ...args) => setTimeout(fn, 0, ...args);
  global.clearImmediate = (id) => clearTimeout(id);
}

// Still needed: react-dom's SERVER renderer references MessageChannel directly at module load.
// Unref the ports so this channel never keeps the event loop alive either.
if (typeof global.MessageChannel === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { MessageChannel } = require('worker_threads');
  global.MessageChannel = class extends MessageChannel {
    constructor() {
      super();
      this.port1.unref();
      this.port2.unref();
    }
  };
}

if (typeof global.TextEncoder === 'undefined' || typeof global.TextDecoder === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = global.TextEncoder || TextEncoder;
  global.TextDecoder = global.TextDecoder || TextDecoder;
}
