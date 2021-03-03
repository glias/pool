import { cellConver, Token, TokenHolder, TokenInfo } from '..';
import ethereumTokenList from 'gliaswap-token-list/tokens/ethereum/ropsten.json';
import nervosTokenList from 'gliaswap-token-list/tokens/nervos/aggron.json';
import { scriptToHash } from '@nervosnetwork/ckb-sdk-utils';
import { Script as ScriptBuffer } from '../../generated/blockchain';
import { FORCE_BRIDGE_SETTINGS, SUDT_TYPE_CODE_HASH, SUDT_TYPE_HASH_TYPE } from '../../config';
import { Script } from '../cell';

export class TokenHolderFactory {
  private static instace: TokenHolder;
  static getInstance(): TokenHolder {
    if (!this.instace) {
      const erc20Index = TokenHolderFactory.readErc20TokenFile();
      const tokenList = nervosTokenList;
      const tokens: Token[] = [];
      for (let i = 0; i < tokenList.length; i++) {
        const data = tokenList[i];
        const typeScript = cellConver.converScript(data.typeScript);
        const info = new TokenInfo(data.name, data.symbol, data.decimals, data.logoURI, undefined, 'Nervos');

        const typeHash = typeScript
          ? scriptToHash({
              codeHash: typeScript.codeHash,
              hashType: typeScript.hashType as CKBComponents.ScriptHashType,
              args: typeScript.args,
            })
          : '0x0000000000000000000000000000000000000000000000000000000000000000';

        const token = new Token(typeHash, typeScript, info, undefined, null);
        tokens.push(token);
      }

      erc20Index.forEach((erc20) => {
        const typeScript = TokenHolderFactory.buildShadowAssetTypeScript(erc20.address);
        const info = new TokenInfo(
          'ck' + erc20.name,
          'ck' + erc20.symbol,
          erc20.decimals,
          erc20.logoURI,
          undefined,
          'Nervos',
        );

        const typeHash = scriptToHash({
          codeHash: typeScript.codeHash,
          hashType: typeScript.hashType as CKBComponents.ScriptHashType,
          args: typeScript.args,
        });

        const token = new Token(typeHash, typeScript, info, erc20, null);
        tokens.push(token);
      });

      this.instace = new TokenHolder(tokens);
    }
    return this.instace;
  }

  static readErc20TokenFile(): Map<string, TokenInfo> {
    const tokenList = ethereumTokenList;
    const erc20Index = new Map<string, TokenInfo>();
    for (let i = 0; i < tokenList.length; i++) {
      const data = tokenList[i];
      const info = new TokenInfo(data.name, data.symbol, data.decimals, data.logoURI, data.address, 'Ethereum');

      erc20Index.set(info.address, info);
    }

    return erc20Index;
  }

  static buildShadowAssetTypeScript(erc20Address: string): Script {
    const lockerAddress = FORCE_BRIDGE_SETTINGS.eth_token_locker_addr.slice(2);
    const assetAddress = erc20Address.slice(2);
    const lightClientScriptHash = TokenHolderFactory.getLightClientScriptHash(
      `${FORCE_BRIDGE_SETTINGS.light_client_cell_script.cell_script}`,
    ).slice(2);

    const lockArgs = `0x${lockerAddress}${assetAddress}${lightClientScriptHash}`;
    const issuerLockHash = scriptToHash({
      codeHash: `0x${FORCE_BRIDGE_SETTINGS.bridge_lockscript.code_hash}`,
      args: lockArgs,
      hashType: 'type',
    });
    return new Script(SUDT_TYPE_CODE_HASH, SUDT_TYPE_HASH_TYPE, issuerLockHash);
  }

  static getLightClientScriptHash(cellScript: string): string {
    const buffer = TokenHolderFactory.toArrayBuffer(Buffer.from(cellScript, 'hex'));
    const scriptBuffer = new ScriptBuffer(buffer);
    const codeHash = scriptBuffer.getCodeHash().raw();
    const args = scriptBuffer.getArgs().raw();
    const hashType = scriptBuffer.getHashType();

    return scriptToHash({
      codeHash: '0x' + TokenHolderFactory.toBuffer(codeHash).toString('hex'),
      args: '0x' + TokenHolderFactory.toBuffer(args).toString('hex'),
      hashType: hashType === 0 ? 'data' : 'type',
    });
  }

  static toArrayBuffer = (buf: Buffer): ArrayBuffer => {
    const ab = new ArrayBuffer(buf.length);
    const view = new Uint8Array(ab);
    for (let i = 0; i < buf.length; ++i) {
      view[i] = buf[i];
    }
    return ab;
  };

  static toBuffer = (arrayBuffer: ArrayBuffer): Buffer => {
    const b = Buffer.alloc(arrayBuffer.byteLength);
    const view = new Uint8Array(arrayBuffer);

    for (let i = 0; i < b.length; ++i) {
      b[i] = view[i];
    }
    return b;
  };
}
