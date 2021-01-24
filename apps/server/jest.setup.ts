/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import path from 'path';
import dotenv from 'dotenv';

export default function test() {
  dotenv.config({ path: path.resolve(__dirname, './src/tests/env') });
}
