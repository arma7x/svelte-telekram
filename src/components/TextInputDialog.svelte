<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createKaiNavigator } from '../utils/navigation';
  import SoftwareKey from './SoftwareKey.svelte';
  import TextInputField from './TextInputField.svelte';

  export let title: string = 'TextInputDialog';
  export let placeholder: string = '';
  export let value: string = '';
  export let type: string = 'text';
  export let softKeyLeftText: string = '';
  export let softKeyCenterText: string = 'Close';
  export let softKeyRightText: string = '';
  export let onEnter: Function = (evt, value: string) => {};
  export let onBackspace: Function = (evt, value: string) => {};
  export let onSoftkeyLeft: Function = (evt, value: string) => {};
  export let onSoftkeyRight: Function = (evt, value: string) => {};
  export let onOpened: Function = () => {};
  export let onClosed: Function = (value: string) => {};

  let nodeRef: any;
  let inputDOM: any;
  let softwareKey: SoftwareKey;
  let returnValue: string = '';

  export function setTitleText(text) {
    title = text;
  }

  let navOptions = {
    arrowUpListener: function(evt) {
      evt.preventDefault();
      evt.stopPropagation();
    },
    arrowDownListener: function(evt) {
      evt.preventDefault();
      evt.stopPropagation();
    },
    arrowLeftListener: function(evt) {
      //evt.preventDefault();
      evt.stopPropagation();
    },
    arrowRightListener: function(evt) {
      //evt.preventDefault();
      evt.stopPropagation();
    },
    softkeyLeftListener: function(evt) {
      if (onSoftkeyLeft == null)
        return;
      onSoftkeyLeft(evt, returnValue);
    },
    softkeyRightListener: function(evt) {
      if (onSoftkeyRight == null)
        return;
      onSoftkeyRight(evt, returnValue);
    },
    enterListener: function(evt) {
      if (onEnter == null)
        return;
      onEnter(evt, returnValue);
    },
    backspaceListener: function(evt) {
      if (onBackspace == null)
        return;
      onBackspace(evt, returnValue);
    }
  };

  let navInstance = createKaiNavigator(navOptions);

  function onInput(evt) {
    returnValue = evt.target.value;
  }

  function onFocus(evt) {
    evt.target.focus();
    evt.target.selectionStart = evt.target.selectionEnd = (evt.target.value.length || evt.target.value.length);
  }

  onMount(() => {
    navInstance.attachListener();
    softwareKey = new SoftwareKey({
      target: document.body,
      props: {
        isInvert: true,
        leftText: softKeyLeftText,
        centerText: softKeyCenterText,
        rightText: softKeyRightText
      }
    });
    returnValue = value;
    inputDOM = nodeRef.getElementsByTagName('INPUT')[0];
    inputDOM.focus();
    onOpened();
  })

  onDestroy(() => {
    inputDOM.blur();
    navInstance.detachListener();
    softwareKey.$destroy();
    onClosed(returnValue);
  })

</script>

<svelte:options accessors/>

<div class="kai-dialog" bind:this={nodeRef}>
  <div class="kai-dialog-content">
    <div class="kai-dialog-header">{title}</div>
    <div class="kai-dialog-body">
      <TextInputField label="{undefined}" placeholder="{placeholder}" value="{value}" type="{type}" {onInput} {onFocus} />
    </div>
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
  .kai-dialog > .kai-dialog-content > .kai-dialog-body {}
</style>
