// Pulls in @testing-library/jest-dom's global matcher type augmentation (toBeInTheDocument,
// toBeEmptyDOMElement, ...) so `tsc --noEmit` recognizes them in the *.test.tsx files. The
// matchers themselves are registered at runtime by jest-setup.js.
import '@testing-library/jest-dom';
