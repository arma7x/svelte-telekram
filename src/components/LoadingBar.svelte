<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  export let onOpened: Function = () => {};
  export let onClosed: Function = () => {};

  onMount(() => {
    onOpened();
  })

  onDestroy(() => {
    onClosed();
  })
</script>

<div class="kai-loading-bar">
  <div class="bar bar1"></div>
  <div class="bar bar2"></div>
</div>

<style>
  .kai-loading-bar {
    background-color: var(--themeColor);
    height: 5px;
    top: 0;
    position: fixed;
    width: 100%;
    overflow: hidden;
    -webkit-animation: start 0.3s ease-in;
            animation: start 0.3s ease-in;
  }
  .kai-loading-bar .bar {
    position: absolute;
    background-color: var(--themeColorLight);
    transition: transform 0.2s linear;
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 100%;
  }
  .kai-loading-bar .bar1 {
    -webkit-animation: growBar1 2.5s infinite, moveBar1 2.5s infinite;
            animation: growBar1 2.5s infinite, moveBar1 2.5s infinite;
  }
  .kai-loading-bar .bar2 {
    -webkit-animation: growBar2 2.5s infinite, moveBar2 2.5s infinite;
            animation: growBar2 2.5s infinite, moveBar2 2.5s infinite;
  }
  @-webkit-keyframes growBar1 {
    0% {
      -webkit-animation-timing-function: linear;
              animation-timing-function: linear;
      transform: scaleX(0.1);
    }
    36.6% {
      -webkit-animation-timing-function: cubic-bezier(0.33473, 0.12482, 0.78584, 1);
              animation-timing-function: cubic-bezier(0.33473, 0.12482, 0.78584, 1);
      transform: scaleX(0.1);
    }
    69.15% {
      -webkit-animation-timing-function: cubic-bezier(0.22573, 0, 0.23365, 1.37098);
              animation-timing-function: cubic-bezier(0.22573, 0, 0.23365, 1.37098);
      transform: scaleX(0.83);
    }
    100% {
      transform: scaleX(0.1);
    }
  }
  @keyframes growBar1 {
    0% {
      -webkit-animation-timing-function: linear;
              animation-timing-function: linear;
      transform: scaleX(0.1);
    }
    36.6% {
      -webkit-animation-timing-function: cubic-bezier(0.33473, 0.12482, 0.78584, 1);
              animation-timing-function: cubic-bezier(0.33473, 0.12482, 0.78584, 1);
      transform: scaleX(0.1);
    }
    69.15% {
      -webkit-animation-timing-function: cubic-bezier(0.22573, 0, 0.23365, 1.37098);
              animation-timing-function: cubic-bezier(0.22573, 0, 0.23365, 1.37098);
      transform: scaleX(0.83);
    }
    100% {
      transform: scaleX(0.1);
    }
  }
  @-webkit-keyframes moveBar1 {
    0% {
      left: -105.16667%;
      -webkit-animation-timing-function: linear;
              animation-timing-function: linear;
    }
    20% {
      left: -105.16667%;
      -webkit-animation-timing-function: cubic-bezier(0.5, 0, 0.70173, 0.49582);
              animation-timing-function: cubic-bezier(0.5, 0, 0.70173, 0.49582);
    }
    69.15% {
      left: 21.5%;
      -webkit-animation-timing-function: cubic-bezier(0.30244, 0.38135, 0.55, 0.95635);
              animation-timing-function: cubic-bezier(0.30244, 0.38135, 0.55, 0.95635);
    }
    100% {
      left: 95.44444%;
    }
  }
  @keyframes moveBar1 {
    0% {
      left: -105.16667%;
      -webkit-animation-timing-function: linear;
              animation-timing-function: linear;
    }
    20% {
      left: -105.16667%;
      -webkit-animation-timing-function: cubic-bezier(0.5, 0, 0.70173, 0.49582);
              animation-timing-function: cubic-bezier(0.5, 0, 0.70173, 0.49582);
    }
    69.15% {
      left: 21.5%;
      -webkit-animation-timing-function: cubic-bezier(0.30244, 0.38135, 0.55, 0.95635);
              animation-timing-function: cubic-bezier(0.30244, 0.38135, 0.55, 0.95635);
    }
    100% {
      left: 95.44444%;
    }
  }
  @-webkit-keyframes growBar2 {
    0% {
      -webkit-animation-timing-function: cubic-bezier(0.20503, 0.05705, 0.57661, 0.45397);
              animation-timing-function: cubic-bezier(0.20503, 0.05705, 0.57661, 0.45397);
      transform: scaleX(0.1);
    }
    19.15% {
      -webkit-animation-timing-function: cubic-bezier(0.15231, 0.19643, 0.64837, 1.00432);
              animation-timing-function: cubic-bezier(0.15231, 0.19643, 0.64837, 1.00432);
      transform: scaleX(0.57);
    }
    44.15% {
      -webkit-animation-timing-function: cubic-bezier(0.25776, -0.00316, 0.21176, 1.38179);
              animation-timing-function: cubic-bezier(0.25776, -0.00316, 0.21176, 1.38179);
      transform: scaleX(0.91);
    }
    100% {
      transform: scaleX(0.1);
    }
  }
  @keyframes growBar2 {
    0% {
      -webkit-animation-timing-function: cubic-bezier(0.20503, 0.05705, 0.57661, 0.45397);
              animation-timing-function: cubic-bezier(0.20503, 0.05705, 0.57661, 0.45397);
      transform: scaleX(0.1);
    }
    19.15% {
      -webkit-animation-timing-function: cubic-bezier(0.15231, 0.19643, 0.64837, 1.00432);
              animation-timing-function: cubic-bezier(0.15231, 0.19643, 0.64837, 1.00432);
      transform: scaleX(0.57);
    }
    44.15% {
      -webkit-animation-timing-function: cubic-bezier(0.25776, -0.00316, 0.21176, 1.38179);
              animation-timing-function: cubic-bezier(0.25776, -0.00316, 0.21176, 1.38179);
      transform: scaleX(0.91);
    }
    100% {
      transform: scaleX(0.1);
    }
  }
  @-webkit-keyframes moveBar2 {
    0% {
      left: -54.88889%;
      -webkit-animation-timing-function: cubic-bezier(0.15, 0, 0.51506, 0.40968);
              animation-timing-function: cubic-bezier(0.15, 0, 0.51506, 0.40968);
    }
    25% {
      left: -17.25%;
      -webkit-animation-timing-function: cubic-bezier(0.31033, 0.28406, 0.8, 0.73372);
              animation-timing-function: cubic-bezier(0.31033, 0.28406, 0.8, 0.73372);
    }
    48.35% {
      left: 29.5%;
      -webkit-animation-timing-function: cubic-bezier(0.4, 0.62703, 0.6, 0.90203);
              animation-timing-function: cubic-bezier(0.4, 0.62703, 0.6, 0.90203);
    }
    100% {
      left: 117.38889%;
    }
  }
  @keyframes moveBar2 {
    0% {
      left: -54.88889%;
      -webkit-animation-timing-function: cubic-bezier(0.15, 0, 0.51506, 0.40968);
              animation-timing-function: cubic-bezier(0.15, 0, 0.51506, 0.40968);
    }
    25% {
      left: -17.25%;
      -webkit-animation-timing-function: cubic-bezier(0.31033, 0.28406, 0.8, 0.73372);
              animation-timing-function: cubic-bezier(0.31033, 0.28406, 0.8, 0.73372);
    }
    48.35% {
      left: 29.5%;
      -webkit-animation-timing-function: cubic-bezier(0.4, 0.62703, 0.6, 0.90203);
              animation-timing-function: cubic-bezier(0.4, 0.62703, 0.6, 0.90203);
    }
    100% {
      left: 117.38889%;
    }
  }
  @-webkit-keyframes start {
    from {
      max-height: 0;
      opacity: 0;
    }
    to {
      max-height: 20px;
      opacity: 1;
    }
  }
  @keyframes start {
    from {
      max-height: 0;
      opacity: 0;
    }
    to {
      max-height: 20px;
      opacity: 1;
    }
  }
  @-webkit-keyframes end {
    from {
      max-height: 0;
      opacity: 0;
    }
    to {
      max-height: 2px;
      opacity: 1;
    }
  }
  @keyframes end {
    from {
      max-height: 0;
      opacity: 0;
    }
    to {
      max-height: 2px;
      opacity: 1;
    }
  }
  @-webkit-keyframes loadingLinearMovement {
    0% {
      left: -100%;
    }
    50% {
      left: 100%;
    }
    100% {
      left: 100%;
    }
  }
  @keyframes loadingLinearMovement {
    0% {
      left: -100%;
    }
    50% {
      left: 100%;
    }
    100% {
      left: 100%;
    }
  }
</style>
