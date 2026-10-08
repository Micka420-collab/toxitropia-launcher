import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
const compiled=await build({stdin:{contents:`export * from './src/shared/defaults';
export * from './src/shared/profileMigration';`,resolveDir:process.cwd(),loader:'ts'},
 bundle:true,platform:'node',format:'esm',write:false});
const {DEFAULT_MANIFEST,defaultSettings,migrateBuiltInProfile,LEGACY_MANIFEST_URL}=
 await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const oldFactory=()=>({...structuredClone(DEFAULT_MANIFEST),
 server:{name:'Zarn',ip:'82.67.63.61',port:25569},
 minecraft:{version:'1.21.1',loader:'neoforge',loaderVersion:'21.1.233'}});
test('MCGenesis factory profile matches Paper and keeps the owner public IP',()=>{
 assert.deepEqual(DEFAULT_MANIFEST.server,{name:'MCGenesis',ip:'82.67.63.61',port:25565});
 assert.deepEqual(DEFAULT_MANIFEST.minecraft,{version:'1.21.11',loader:'vanilla'});
 assert.equal(DEFAULT_MANIFEST.java.recommendedMajor,21);
 assert.deepEqual(DEFAULT_MANIFEST.mods,[]);assert.deepEqual(DEFAULT_MANIFEST.resources,[]);
 assert.equal(defaultSettings('/game').autoConnect,true);
 assert.equal(defaultSettings('/game').manifestUrl,'');
});
test('old shipped cache migrates without writing into the old modpack game directory',()=>{
 const result=migrateBuiltInProfile(oldFactory(),LEGACY_MANIFEST_URL,'/old','/old','/new');
 assert.deepEqual(result.manifest,DEFAULT_MANIFEST);assert.equal(result.manifestUrl,'');
 assert.equal(result.gameDir,'/new');
 const customDir=migrateBuiltInProfile(oldFactory(),LEGACY_MANIFEST_URL,'/custom','/old','/new');
 assert.equal(customDir.gameDir,'/custom');
});
test('custom manifests and remote sources remain unchanged',()=>{
 const custom=oldFactory();custom.server.port=25570;
 const result=migrateBuiltInProfile(custom,LEGACY_MANIFEST_URL,'/old','/old','/new');
 assert.deepEqual(result,{manifest:custom,manifestUrl:LEGACY_MANIFEST_URL,gameDir:'/old'});
 const url='https://example.com/custom.json';
 assert.equal(migrateBuiltInProfile(oldFactory(),url,'/old','/old','/new').manifestUrl,url);
 assert.equal(migrateBuiltInProfile(oldFactory(),url,'/old','/old','/new').manifest.minecraft.loader,'neoforge');
});
test('fresh state gets an independent copy of the built-in manifest',()=>{
 const result=migrateBuiltInProfile(null,'','/new','/old','/new');
 result.manifest.server.ip='changed';assert.equal(DEFAULT_MANIFEST.server.ip,'82.67.63.61');
});
