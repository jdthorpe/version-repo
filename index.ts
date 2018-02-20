export { MemoryRepo } from "./src/memory_repo";
export { ReadonlyBuffer } from "./src/buffer";
export { ProcessedBuffer } from "./src/processed_buffer";
export { calculate_dependencies } from './src/version_resolution';
export { dTransform, sTransform } from './src/transform';

//-- epxlicit export of typings works with tsc but not WebPack
//-- export { repository, deferred_repository } from './src/typings.d';
export * from './src/utils'

