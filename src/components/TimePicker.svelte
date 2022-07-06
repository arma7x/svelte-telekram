<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createKaiNavigator } from '../utils/navigation';
  import SoftwareKey from './SoftwareKey.svelte';

  export let title: string = 'Date Picker';
  export let date: Date = new Date();
  export let is12HourSystem: boolean = false;
  export let localization: [string, string] = ['AM', 'PM'];
  export let softKeyLeftText: string = 'cancel';
  export let softKeyCenterText: string = 'Save';
  export let softKeyRightText: string = '';
  export let onEnter: Function = (evt, date: Date) => {};
  export let onBackspace: Function = (evt, date: Date) => {};
  export let onSoftkeyLeft: Function = (evt, date: Date) => {};
  export let onSoftkeyRight: Function = (evt, date: Date) => {};
  export let onOpened: Function = () => {};
  export let onClosed: Function = (date: Date) => {};

  const navClass = 'time-nav';
  let navClasses = [];
  let navClassIndex = -1;
  let softwareKey: SoftwareKey;
  let immutableDate: Date;
  let minutes = 0;
  let duration = localization[0];

  export function setTitleText(text) {
    title = text;
  }

  function nav(next) {
    const currentIndex = navClassIndex;
    var move = navClassIndex + next;
    var cursor:any = navClasses[move];
    if (cursor != undefined) {
      navClassIndex = move;
    } else {
      if (move < 0) {
        move = navClasses.length - 1;
      } else if (move >= navClasses.length) {
        move = 0;
      }
      cursor = navClasses[move];
      navClassIndex = move;
    }
    cursor.classList.add('focus');
    if (navClasses[currentIndex]) {
      navClasses[currentIndex].classList.remove('focus');
    }
  }

  function setHour(move) {
    const cursor = navClasses[0];
    date.setHours(date.getHours() + move);
    if (is12HourSystem === false) {
      cursor.previousElementSibling.textContent = date.getHours() - 1  === -1 ? '' : formatInteger(date.getHours() - 1);
      cursor.textContent = formatInteger(date.getHours());
      cursor.nextElementSibling.textContent= date.getHours() + 1 > 23 ? '' : formatInteger(date.getHours() + 1);
    } else {
      var hours = (date.getHours() % 12) || 12;
      cursor.previousElementSibling.textContent = hours - 1 ? formatInteger(hours - 1) : '';
      cursor.textContent = formatInteger(hours);
      cursor.nextElementSibling.textContent = hours + 1 > 12 ? '' : formatInteger(hours + 1);
    }
  }

  function setMinute(move) {
    minutes += move;
    if (minutes === -1) {
      minutes = 58;
      setMinute(1);
      return;
    } else if (minutes === 60) {
      minutes = 1;
      setMinute(-1);
      return;
    }
    const cursor = navClasses[1];
    cursor.previousElementSibling.textContent = minutes - 1 === -1 ? '' : formatInteger(minutes - 1);
    cursor.textContent = formatInteger(minutes);
    cursor.nextElementSibling.textContent = minutes + 1 > 59 ? '' : formatInteger(minutes + 1);
  }

  function setDuration(move) {
    var idx = localization.indexOf(duration);
    idx += move;
    if (idx === -1) {
      duration = localization[0];
      setDuration(1);
      return;
    } else if (idx === 2) {
      duration = localization[1];
      setDuration(-1);
      return;
    }
    duration = localization[idx];
    const cursor = navClasses[2];
    cursor.previousElementSibling.textContent = localization[idx - 1] || '';
    cursor.textContent = localization[idx];
    cursor.nextElementSibling.textContent = localization[idx + 1] || '';
  }

  function formatInteger(n: int): string {
    if (n < 10)
      return `0${n}`;
    return n;
  }

  function formatDate(): Date {
    var h;
    if (is12HourSystem === false) {
      h = date.getHours();
    } else {
      var hours = (date.getHours() % 12) || 12;
      if (duration === localization[0] && hours === 12) {
        hours = 0;
      } else if (duration === localization[1]) {
        hours += 12;
        if (hours === 24)
          hours = 12;
      }
      h = hours;
    }
    immutableDate.setHours(h);
    immutableDate.setMinutes(minutes);
    return immutableDate;
  }

  let navOptions = {
    arrowUpListener: function(evt) {
      if (navClassIndex == 0) {
        setHour(-1);
      } else if (navClassIndex == 1) {
        setMinute(-1);
      } else if (navClassIndex == 2) {
        setDuration(-1);
      }
      evt.preventDefault();
      evt.stopPropagation();
    },
    arrowDownListener: function(evt) {
      if (navClassIndex == 0) {
        setHour(1);
      } else if (navClassIndex == 1) {
        setMinute(1);
      } else if (navClassIndex == 2) {
        setDuration(1);
      }
      evt.preventDefault();
      evt.stopPropagation();
    },
    arrowLeftListener: function(evt) {
      nav(-1);
      evt.preventDefault();
      evt.stopPropagation();
    },
    arrowRightListener: function(evt) {
      nav(1);
      evt.preventDefault();
      evt.stopPropagation();
    },
    softkeyLeftListener: function(evt) {
      if (onSoftkeyLeft == null)
        return;
      onSoftkeyLeft(evt, formatDate());
    },
    softkeyRightListener: function(evt) {
      if (onSoftkeyRight == null)
        return;
      onSoftkeyRight(evt, formatDate());
    },
    enterListener: function(evt) {
      if (onEnter == null)
        return;
      onEnter(evt, formatDate());
    },
    backspaceListener: function(evt) {
      if (onBackspace == null)
        return;
      onBackspace(evt, formatDate());
    }
  };

  let navInstance = createKaiNavigator(navOptions);

  onMount(() => {
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
    const doms = document.getElementsByClassName(navClass);
    const keys = Object.keys(doms);
    for (var k in keys) {
      navClasses.push(doms[k]);
    }
    immutableDate = new Date(date.getTime());
    immutableDate.setSeconds(0);
    immutableDate.setMilliseconds(0);
    minutes = date.getMinutes();
    nav(1);
    if (is12HourSystem) {
      if (date.getHours() > 11)
        duration = localization[1];
      setDuration(0);
    }
    setMinute(0);
    setHour(0);
    onOpened();
  })

  onDestroy(() => {
    navInstance.detachListener();
    softwareKey.$destroy();
    onClosed(formatDate());
  })

</script>

<svelte:options accessors/>

<div class="kai-dialog">
  <div class="kai-dialog-content">
    <div class="kai-dialog-header">{title}</div>
    <div class="kai-dialog-body">
      <div class="time-picker-row">
        <div class="time-column">
          <div class="time-block">-HH</div>
          <div class="{navClass} time-block navable">HH</div>
          <div class="time-block">+HH</div>
        </div>
        <div class="time-line"></div>
        <div class="time-column">
          <div class="time-block">-MM</div>
          <div class="{navClass} time-block navable">MM</div>
          <div class="time-block">+MM</div>
        </div>
        {#if is12HourSystem }
        <div class="time-line"></div>
        <div class="time-column">
          <div class="time-block">-DD</div>
          <div class="{navClass} time-block navable">DD</div>
          <div class="time-block">+DD</div>
        </div>
        {/if}
      </div>
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
  .kai-dialog > .kai-dialog-content > .kai-dialog-body {
    padding: 5px 0px;
  }
  .kai-dialog > .kai-dialog-content > .kai-dialog-body > .time-picker-row {
    display: flex;
    flex-direction: row;
    justify-content: stretch;
    align-items: stretch;
  }
  .kai-dialog > .kai-dialog-content > .kai-dialog-body > .time-picker-row > .time-column {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: stretch;
    text-align: center;
  }
  .kai-dialog > .kai-dialog-content > .kai-dialog-body > .time-picker-row > .time-line {
    width: 1px;
    background-color: #cacaca;
  }
  .kai-dialog > .kai-dialog-content > .kai-dialog-body > .time-picker-row > .time-column > .time-block {
    display:block;
    vertical-align: middle;
    text-align: center;
    padding: 10px 0;
    height: 38px;
    color: #323232;
    font-size: 15px;
  }
  .kai-dialog > .kai-dialog-content > .kai-dialog-body > .time-picker-row > .time-column > .time-block.navable {
    color: var(--themeColor);
    font-size: 17px;
  }
  .kai-dialog > .kai-dialog-content > .kai-dialog-body > .time-picker-row > .time-column > .time-block.navable.focus {
    color: #ffffff;
    background-color: var(--themeColor);
    font-weight: bold;
  }
</style>
