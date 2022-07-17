<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createKaiNavigator, KaiNavigator } from '../../../utils/navigation';

  import { client } from '../../../utils/bootstrap';
  import { Buffer} from 'buffer';

  export let message: any = {};
  export let parentNavInstance: typeof KaiNavigator;
  export let registerCallback: Function = (id, callback) => {}

  let JPEG_HEADER = Buffer.from(
    'ffd8ffe000104a46494600010100000100010000ffdb004300281c1e231e1928' +
    '2321232d2b28303c64413c37373c7b585d4964918099968f808c8aa0b4e6c3a0aad' +
    'aad8a8cc8ffcbdaeef5ffffff9bc1fffffffaffe6fdfff8ffdb0043012b2d2d3c35' +
    '3c76414176f8a58ca5f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f' +
    '8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8ffc0001108000000' +
    '0003012200021101031101ffc4001f0000010501010101010100000000000000000' +
    '102030405060708090a0bffc400b5100002010303020403050504040000017d0102' +
    '0300041105122131410613516107227114328191a1082342b1c11552d1f02433627' +
    '282090a161718191a25262728292a3435363738393a434445464748494a53545556' +
    '5758595a636465666768696a737475767778797a838485868788898a92939495969' +
    '798999aa2a3a4a5a6a7a8a9aab2b3b4b5b6b7b8b9bac2c3c4c5c6c7c8c9cad2d3d4' +
    'd5d6d7d8d9dae1e2e3e4e5e6e7e8e9eaf1f2f3f4f5f6f7f8f9faffc4001f0100030' +
    '101010101010101010000000000000102030405060708090a0bffc400b511000201' +
    '0204040304070504040001027700010203110405213106124151076171132232810' +
    '8144291a1b1c109233352f0156272d10a162434e125f11718191a262728292a3536' +
    '3738393a434445464748494a535455565758595a636465666768696a73747576777' +
    '8797a82838485868788898a92939495969798999aa2a3a4a5a6a7a8a9aab2b3b4b5' +
    'b6b7b8b9bac2c3c4c5c6c7c8c9cad2d3d4d5d6d7d8d9dae2e3e4e5e6e7e8e9eaf2f' +
    '3f4f5f6f7f8f9faffda000c03010002110311003f00',
    'hex'
  );
  let JPEG_FOOTER = Buffer.from('ffd9', 'hex');
  let mediaSrc: any;

  // https://github.com/gram-js/gramjs/issues/223
  function strippedPhotoToJpg(stripped) {
    if (stripped.length < 3 || stripped[0] !== 1) {
      return stripped
    }

    const result = Buffer.concat([JPEG_HEADER, stripped.slice(3), JPEG_FOOTER])
    result[164] = stripped[1]
    result[166] = stripped[2]
    return result
  }

  function actionMenu() {
    console.log('Clicked:', message.id.toString());
  }

  onMount(async () => {
    registerCallback(message.id.toString(), actionMenu);
    //try {
      //const result = await client.downloadMedia(message.media);
      //const reader = new FileReader();
      //reader.readAsDataURL(new Blob([result], {type : message.media.document.mimeType}));
      //reader.onloadend = () => {
        //mediaSrc = reader.result;
      //}
    //} catch (err) {
      //console.log(err);
    //}
    //const arrBuff = strippedPhotoToJpg(Buffer.from(message.media.document.thumbs[0].originalArgs.bytes));
    //const reader = new FileReader();
    //reader.readAsDataURL(new Blob([arrBuff], {type : 'image/jpeg'}));
    //reader.onloadend = () => {
      //console.log(reader.result);
    //}
  })

</script>

<svelte:options accessors immutable={true}/>
<div class="media-container">
  {#if mediaSrc}
    <video  src="{mediaSrc}" type="{message.media.document.mimeType}" autoplay loop></video>
  {/if}
  <span style="color:#A20000;">Unsupported Media: Video</span>
</div>

<style>
.media-container {
  text-align: start;
}
</style>
