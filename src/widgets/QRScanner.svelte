<script lang="ts">

  import { onMount, onDestroy } from 'svelte';
  import { createKaiNavigator } from '../utils/navigation';
  import { SoftwareKey, Separator } from '../components';
  import { TelegramKeyHash, Api, client } from '../utils/bootstrap';
  import jsQR from "jsqr";

  export let title: string = 'Link Device';
  export let onBackspace: Function = (evt) => {};
  export let onOpened: Function = () => {};
  export let onClosed: Function = () => {};
  export let callback: Function = (buf: Buffer) => {};

  let nodeRef:any;
  let softwareKey: SoftwareKey;
  let scanning: any = null;

  let navOptions = {
    softkeyRightListener: function(evt) {
      onBackspace(evt);
    },
    backspaceListener: function(evt) {
      onBackspace(evt);
    }
  };

  let navInstance = createKaiNavigator(navOptions);

  onMount(() => {
    navInstance.attachListener();
    softwareKey = new SoftwareKey({
      target: document.body,
      props: {
        isInvert: false,
        leftText: '',
        centerText: '',
        rightText: 'Cancel'
      }
    });
    onOpened();
    navigator.mediaDevices.getUserMedia({ audio: false, video: true })
    .then((stream) => {
      // const video = document.getElementById("qr_video");
      nodeRef.srcObject = stream;
      nodeRef.onloadedmetadata = (e) => {
        nodeRef.play();
        let barcodeCanvas = document.createElement("canvas");
        scanning = setInterval(() => {
          barcodeCanvas.width = nodeRef.videoWidth;
          barcodeCanvas.height = nodeRef.videoHeight;
          let barcodeContext = barcodeCanvas.getContext("2d");
          let imageWidth = Math.max(1, Math.floor(nodeRef.videoWidth)),imageHeight = Math.max(1, Math.floor(nodeRef.videoHeight));
          barcodeContext.drawImage(nodeRef, 0, 0, imageWidth, imageHeight);
          let imageData = barcodeContext.getImageData(0, 0, imageWidth, imageHeight);
          let idd = imageData.data;
          let code = jsQR(idd, imageWidth, imageHeight);
          if (code) {
            if (scanning != null) {
              clearInterval(scanning);
            }
            // console.log(code.data);
            callback(code.data.replace('tg://login?token=', ''));
          }
        }, 1000);
      };
    }).catch((err) => {
      console.log(err);
    });
  })

  onDestroy(() => {
    navigator.mediaDevices.getUserMedia({ audio: false, video: true })
    .then((stream) => {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
    });
    if (scanning != null) {
      clearInterval(scanning);
    }
    navInstance.detachListener();
    softwareKey.$destroy();
    onClosed();
  })

</script>

<svelte:options accessors/>

<div class="kai-dialog">
  <div class="kai-dialog-content">
    <div class="kai-dialog-header">{title}</div>
    <div class="kai-dialog-body">
      <div style="overflow:hidden;height:212px;">
        <video bind:this={nodeRef} height="320" width="240" autoplay></video>
      </div>
    </div>
  </div>
</div>

<style>
  .kai-dialog {
    width: 100%;
    height: calc(100% - 12px);
    bottom: 30px;
    position: fixed;
    background-color: rgba(0, 0, 0, 0.6);
  }
  .kai-dialog > .kai-dialog-content {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-height: calc(100% - 66px);
    bottom: 30px;
    position: fixed;
    background-color: #ffffff;
  }
  .kai-dialog > .kai-dialog-content > .kai-dialog-header {
    width: 100%;
    text-align: center;
    vertical-align: middle;
    line-height: 28px;
    height: 28px;
    padding: 0 4px;
    color: #313131;
    background-color: #cccccc;
    font-weight: 200;
  }
  .kai-dialog > .kai-dialog-content > .kai-dialog-body {
    max-height: calc(100% - 78px);
    height: 220px;
    overflow: scroll;
    padding: 5px;
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
  }
</style>
