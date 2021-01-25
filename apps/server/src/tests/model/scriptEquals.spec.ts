import { Script, scriptEquals } from '../../model';
import * as lumos from '@ckb-lumos/base';

const script = new Script(
  '0x58c5f491aba6d61678b7cf7edf4910b1f5e00ec0cde2f42e0abb4fd9aff25a63',
  'type',
  '0x988485609e16d5d5c62be0a4ae12b665fefcb448',
);

test('equals lock return true', () => {
  const target = script;
  expect(scriptEquals.equalsLockScript(script, target)).toEqual(true);
});

test('equals lock return false', () => {
  const target = new Script(script.codeHash, script.hashType, '');
  expect(scriptEquals.equalsLockScript(script, target)).toEqual(false);
});

test('contrast model.Script and lumos.Script', () => {
  const target: lumos.Script = {
    code_hash: script.codeHash,
    hash_type: <lumos.HashType>script.hashType,
    args: script.args,
  };
  expect(scriptEquals.equalsLockScript(script, target)).toEqual(true);
});

test('equals ScriptWrapper lock return true', () => {
  const target: lumos.Script = {
    code_hash: script.codeHash,
    hash_type: <lumos.HashType>script.hashType,
    args: `${script.args}000000000011111100000011111`,
  };
  const ScriptWrapper: lumos.ScriptWrapper = {
    script: target,
    argsLen: 'any',
  };
  expect(scriptEquals.matchLockScriptWapper(ScriptWrapper, target)).toEqual(true);
});

test('equals type return true', () => {
  const target = script;
  expect(scriptEquals.equalsTypeScript(script, target)).toEqual(true);
});

test('equals type return false', () => {
  const target = new Script(script.codeHash, script.hashType, '');
  expect(scriptEquals.equalsTypeScript(script, target)).toEqual(false);
});

test('equals script or targetScript is null', () => {
  expect(scriptEquals.equalsTypeScript(script, null)).toEqual(false);
});

test('equals script is "empty"', () => {
  expect(scriptEquals.equalsTypeScript(script, 'empty')).toEqual(false);
});

test('equals ScriptWrapper type return true', () => {
  const target: lumos.Script = {
    code_hash: script.codeHash,
    hash_type: <lumos.HashType>script.hashType,
    args: `${script.args}000000000011111100000011111`,
  };
  const ScriptWrapper: lumos.ScriptWrapper = {
    script: target,
    argsLen: 'any',
  };
  expect(scriptEquals.matchTypeScriptWapper(ScriptWrapper, target)).toEqual(true);
});
