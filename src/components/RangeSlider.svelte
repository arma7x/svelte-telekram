<script lang="ts">

  export let progressType:number = 0; // 0:NONE, 1:PERCENTAGE, 2:COUNTER
  export let label: string = '';
  export let value: number = 0;
  export let min: number = 0;
  export let max: number = 100;

  function updateProgress(val) {
    if (val < min || val > max)
      return progress;
    return progress = Math.round((val / max) * 100);
  }

  $: progress = updateProgress(value);

</script>

<div class="kai-range-slider-content">
  {#if progressType != 0 || label != null}
  <div class="kai-range-slider-header">
    <span>{label == null ? '' : label}</span>
    {#if progressType == 1}
    <span class="indicator">{progress}%</span>
    {:else if progressType == 2}
    <span class="indicator">{value}/{max}</span>
    {/if}
  </div>
  {/if}
  <div class="kai-range-slider-body">
    <div class="kai-range-slider-track"></div>
    <div class="kai-range-slider-track-shadow"></div>
    <div class="kai-range-slider-loaded" style="width:calc({progress}%);border-radius:4px 0px 0px 4px;"></div>
    <div class="kai-range-slider-thumb" style="left:calc({progress}%);"></div>
  </div>
</div>

<style>

  .kai-range-slider-content {
    margin-top: -16px;
    width: calc(100% - 22px);
  }

  .kai-range-slider-content > .kai-range-slider-header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .kai-range-slider-content > .kai-range-slider-header  > .indicator {
    margin-right: -22px;
  }

  .kai-range-slider-content > .kai-range-slider-body {
    position: relative;
    width: 100%;
  }

  .kai-range-slider-content > .kai-range-slider-body > .kai-range-slider-track {
    width: 100%;
    background-color: #CCCCCC;
    height: 8px;
    border-radius: 4px;
    top: 0px;
    position: absolute;
  }

  .kai-range-slider-content > .kai-range-slider-body > .kai-range-slider-track-shadow {
    width: calc(100% + 22px);
    background-color: #CCCCCC;
    height: 8px;
    border-radius: 4px;
    top: 0px;
    position: absolute;
  }

  .kai-range-slider-content > .kai-range-slider-body > .kai-range-slider-loaded {
    background-color: var(--themeColor);
    height: 8px;
    top: 0px;
    position: absolute;
  }

  .kai-range-slider-content > .kai-range-slider-body > .kai-range-slider-thumb {
    background-color: var(--themeColor);
    border: 3px solid #ffffff;
    height: 22px;
    width: 22px;
    border-radius: 50%;
    top: -7px;
    position: absolute;
    z-index: 1;
  }

  :global(.kai-list-view.focus > .kai-range-slider-content > .kai-range-slider-body > .kai-range-slider-track) {
    background-color: #8C8C8C!important;
  }

  :global(.kai-list-view.focus > .kai-range-slider-content > .kai-range-slider-body > .kai-range-slider-loaded) {
    background-color: #ffffff!important;
  }

  :global(.kai-list-view.focus > .kai-range-slider-content > .kai-range-slider-body > .kai-range-slider-thumb) {
    background-color: #ffffff!important;
    border: 3px solid var(--themeColor)!important;
  }
</style>
