// @ts-expect-error: Deno/Browser external import
import { registerMvuSchema } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';
import { Schema } from '../../schema';

declare const $: any;

$(() => {
  registerMvuSchema(Schema);
});