/* @flow */

import { traverse } from 'babel-core';

import type { State, NodePath } from '../types';

export default function buildPrevalCodeFrame(error: Error, state: State) {
  const idMatch = error.stack.split('\n')[1].match(/at (.+) \(/);

  if (!idMatch) {
    return error;
  }

  let pathForCodeFrame: ?NodePath<any>;

  const id = idMatch[1];
  traverse(state.file.ast.program, {
    Identifier(path) {
      if (path.node.name === id) {
        pathForCodeFrame = path;

        path.parentPath.traverse({
          ThrowStatement(throwPath) {
            pathForCodeFrame = throwPath;
          },
        });
      }
    },
  });

  if (!pathForCodeFrame) {
    // handle error
    return error;
  }

  return pathForCodeFrame.buildCodeFrameError(error.message, Error);
}
