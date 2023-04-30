<script lang="ts">

  declare var QRCode:any;

  import { onMount, onDestroy } from 'svelte';
  import { createKaiNavigator } from '../utils/navigation';
  import { SoftwareKey, Separator } from '../components';
  import { Api, client } from '../utils/bootstrap';

  import { dispatchMessageToClient, dispatchMessageToWorker } from '../telegram';

  export let title: string = 'Log-In via QR Code';
  export let onBackspace: Function = (evt) => {};
  export let onOpened: Function = () => {};
  export let onClosed: Function = () => {};

  let softwareKey: SoftwareKey;
  let qrcode: QRCode;
  let regenerate: any = null;

  let navOptions = {
    softkeyRightListener: function(evt) {
      onBackspace(evt);
    },
    backspaceListener: function(evt) {
      onBackspace(evt);
    }
  };

  let navInstance = createKaiNavigator(navOptions);

  function handleWebWorkerMessage(data: any) {
    switch (data.type) {
      case 5:
        // console.log('exportLoginToken:', data.params);
        if (regenerate != null) {
          clearTimeout(regenerate);
          regenerate = null;
        }
        if (qrcode) {
          qrcode.clear();
        }
        const container = document.getElementById('qr-container');
        container.textContent = '';
        const _data = `tg://login?token=${btoa(String.fromCharCode.apply(null, data.params.token))}`;
        qrcode = new QRCode(container, {
          text: _data,
          width: 200,
          height: 200,
          colorDark : "#000000",
          colorLight : "#ffffff",
          correctLevel : QRCode.CorrectLevel.H
        });
        regenerate = setTimeout(() => {
          exportLoginToken();
        }, 31000);
        break;
      case -5:
        console.error('exportLoginToken:', data.params);
        break;
    }
  }

  function exportLoginToken() {
    const params = {
      type: 5,
      params: {
        apiId: parseInt(process.env.APP_ID),
        apiHash: process.env.APP_HASH,
        exceptIds: [],
      }
    }
    dispatchMessageToWorker.emit('message', params);
  }

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
    dispatchMessageToClient.addListener('message', handleWebWorkerMessage);
    exportLoginToken();
  })

  onDestroy(() => {
    if (regenerate != null) {
      clearTimeout(regenerate);
    }
    navInstance.detachListener();
    softwareKey.$destroy();
    onClosed();
    dispatchMessageToClient.removeListener('message', handleWebWorkerMessage);
  })

</script>

<svelte:options accessors/>

<div class="kai-dialog">
  <div class="kai-dialog-content">
    <div class="kai-dialog-header">{title}</div>
    <div class="kai-dialog-body">
      <div id="qr-container"></div>
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
