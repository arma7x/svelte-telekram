<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createKaiNavigator } from '../utils/navigation';
  import SoftwareKey from './SoftwareKey.svelte';

  export let title: string = 'Dialog';
  export let body: string = '';
  export let softKeyLeftText: string = '';
  export let softKeyCenterText: string = 'Close';
  export let softKeyRightText: string = '';
  export let onEnter: Function = (evt) => {};
  export let onBackspace: Function = (evt) => {};
  export let onSoftkeyLeft: Function = (evt) => {};
  export let onSoftkeyRight: Function = (evt) => {};
  export let onOpened: Function = () => {};
  export let onClosed: Function = () => {};

  let softwareKey: SoftwareKey;

  export function setTitleText(text) {
    title = text;
  }

  let navOptions = {
    arrowUpListener: function(evt) {
      document.getElementsByClassName('kai-dialog-body')[0].scrollTop -= 20;
      evt.preventDefault();
      evt.stopPropagation();
    },
    arrowDownListener: function(evt) {
      document.getElementsByClassName('kai-dialog-body')[0].scrollTop += 20;
      evt.preventDefault();
      evt.stopPropagation();
    },
    arrowLeftListener: function(evt) {
      document.getElementsByClassName('kai-dialog-body')[0].scrollLeft -= 20;
      evt.preventDefault();
      evt.stopPropagation();
    },
    arrowRightListener: function(evt) {
      document.getElementsByClassName('kai-dialog-body')[0].scrollLeft += 20;
      evt.preventDefault();
      evt.stopPropagation();
    },
    softkeyLeftListener: function(evt) {
      if (onSoftkeyLeft == null)
        return;
      console.log('softkeyLeftListener', title);
      onSoftkeyLeft(evt);
    },
    softkeyRightListener: function(evt) {
      if (onSoftkeyRight == null)
        return;
      console.log('softkeyRightListener', title);
      onSoftkeyRight(evt);
    },
    enterListener: function(evt) {
      if (onEnter == null)
        return;
      console.log('enterListener', title);
      onEnter(evt);
    },
    backspaceListener: function(evt) {
      if (onBackspace == null)
        return;
      console.log('backspaceListener', title);
      onBackspace(evt);
    }
  };

  let navInstance = createKaiNavigator(navOptions);

  onMount(() => {
    console.log('onMount', title);
    navInstance.attachListener();
    softwareKey = new SoftwareKey({
      target: document.body,
      props: {
        isInvert: false,
        leftText: softKeyLeftText,
        centerText: softKeyCenterText,
        rightText: softKeyRightText
      }
    });
    onOpened();
  })

  onDestroy(() => {
    console.log('onDestroy', title);
    navInstance.detachListener();
    softwareKey.$destroy();
    onClosed();
  })

</script>

<svelte:options accessors/>

<div class="kai-dialog">
  <div class="kai-dialog-content">
    <div class="kai-dialog-header">{title}</div>
    <div class="kai-dialog-body">{body}</div>
  </div>
</div>

<style>
  .kai-dialog {
    width: 100%;
    height: calc(100% - 30px);
    bottom: 30px;
    position: fixed;
    background-color: rgba(0, 0, 0, 0.6);
  }
  .kai-dialog > .kai-dialog-content {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-height: calc(100% - 84px);
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
    padding: 4px;
    max-height: calc(100% - 96px);
    overflow: scroll;
  }
</style>
