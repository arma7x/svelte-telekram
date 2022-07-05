<script lang="ts">
  export let leftText: string = 'Left';
  export let centerText: string = 'Center';
  export let rightText: string = 'Right';
  export let isInvert: bool = false;

  export function setLeftText(text) {
    leftText = text;
  }

  export function setCenterText(text) {
    centerText = text;
  }

  export function setRightText(text) {
    rightText = text;
  }

  export function setText(opts = {}) {
    if (opts['left'] != null)
      setLeftText(opts['left']);
    if (opts['center'] != null)
      setCenterText(opts['center']);
    if (opts['right'] != null)
      setRightText(opts['right']);
  }

  export function normalStyle() {
    isInvert = false;
  }

  export function invertStyle() {
    isInvert = true;
  }
  
</script>

<div class="kai-software-key {isInvert ? 'invert' : ''}">
  <div class="left">{leftText}</div>
  <div class="center">{centerText}</div>
  <div class="right">{rightText}</div>
</div>

<style>
  .kai-software-key {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    bottom: 0px;
    position: fixed;
    color: #00000;
    background-color: #CCCCCC;
    height: 30px;
    width: 100%;
  }
  .kai-software-key.invert {
    color: #ffffff;
    background-color: #000000;
  }
  .kai-software-key > .left {
    text-align: start;
    padding-left: 4px;
    width: calc(33% - 4px);
  }
  .kai-software-key > .center {
    text-align: center;
    text-transform: uppercase;
    font-weight: 600;
    width: 34%;
  }
  .kai-software-key > .right {
    text-align: end;
    padding-right: 4px;
    width: calc(33% - 4px);
  }
</style>
