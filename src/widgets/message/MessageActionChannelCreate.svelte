<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createKaiNavigator, KaiNavigator } from '../../utils/navigation';

  export let key: any = '';
  export let entity: any = {};
  export let message: any = {};
  export let className: string = null;
  export let onClick: Function = (evt) => {}
  export let parentNavInstance: typeof KaiNavigator;
  export let registerCallback: Function = (id, callback) => {}
  export let replyTo: any;

  onMount(() => {
    // console.log(message);
  });

</script>

<div data-key="{key}" class="kai-list-view {className ? className : ''}" on:click={onClick}>
  <div class="kai-list-view-content">
    <p>Channel created</p>
  </div>
</div>

<style>
  .kai-list-view {
    background-color: transparent;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    box-sizing: border-box;
    max-height: 100px;
    width: 100%;
    font-size: 14px;
  }

  .kai-list-view > .kai-list-view-content {
    box-sizing: border-box;
    padding: 8px!important;
    background-color: transparent;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: start;
    padding: 0px 4px 0px 0px;
    width: 100%;
  }

  .kai-list-view > .kai-list-view-content > p {
    background-color: transparent;
    padding: 0px;
    margin: 0px;
    font-weight: 400;
    color: #323232;
    font-size: 14px;
    text-align: center;
    width: 100%;
    white-space: pre-wrap!important;
    word-break: break-word!important;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: middle;
    display: table-cell;
    vertical-align: middle;
  }

  .kai-list-view.focus,
  .kai-list-view.focus > .kai-list-view-content {
    background-color: var(--themeColorTransparent);
    color: #ffffff;
  }
</style>
