<script lang="ts">
  import { Route, navigate as goto } from "svelte-navigator";
  import { createKaiNavigator } from '../utils/navigation';
  import { Dialog, OptionMenu, SingleSelector, MultiSelector, ListView, Separator, Radio, Checkbox, LoadingBar, LinearProgress, RangeSlider, Button, TextInputField, TextAreaField, TextInputDialog, TextAreaDialog, Radio, Checkbox, DatePicker, TimePicker, Toast, Toaster, SoftwareKey } from '../components';
  import { onMount, onDestroy } from 'svelte';
  import { api } from '../utils/mtproto_client';

  const navClass: string = 'homeNav';
  let locale: string;
  export let location: any;
  export let navigate: any;
  export let getAppProp: Function;

  let name: string = 'Home';
  let dialog: Dialog;
  let optionMenu: OptionMenu;
  let optionMenuIndex:number = 0;
  let singleSelector: SingleSelector;
  let singleSelectorOptions:any = [
    { title: 'Single Selector 0', subtitle: 'Single selector 0 subtitle', selected: true },
    { title: 'Single Selector 1', subtitle: 'Single selector 1 subtitle', selected: false },
    { title: 'Single Selector 2', subtitle: 'Single selector 2 subtitle', selected: false },
    { title: 'Single Selector 3', subtitle: 'Single selector 3 subtitle', selected: false },
    { title: 'Single Selector 4', subtitle: 'Single selector 4 subtitle', selected: false },
  ];
  let multiSelector: MultiSelector;
  let multiSelectorOptions:any = [
    { title: 'Multi Selector 0', subtitle: 'Multi selector 0 subtitle', checked: true },
    { title: 'Multi Selector 1', subtitle: 'Multi selector 1 subtitle', checked: false },
    { title: 'Multi Selector 2', subtitle: 'Multi selector 2 subtitle', checked: false },
    { title: 'Multi Selector 3', subtitle: 'Multi selector 3 subtitle', checked: false },
    { title: 'Multi Selector 4', subtitle: 'Multi selector 4 subtitle', checked: false },
  ];
  let loadingBar: LoadingBar;
  let inputSoftwareKey: SoftwareKey;
  let datePicker: DatePicker;
  let datePickerValue: Date = new Date(1582227193963);
  let timePicker: DatePicker;
  let textInputDialog: TextInputDialog;
  let textAreaDialog: TextAreaDialog;
  let progressValue: number = 0;
  let sliderValue: number = 20;
  let locales:any = [
    { title: 'English - United State', subtitle: 'en-US' },
    { title: 'Japanese', subtitle: 'jp-JP' },
  ];
  let localeMenu: OptionMenu;

  let navOptions = {
    verticalNavClass: navClass,
    softkeyLeftListener: function(evt) {
      if (inputSoftwareKey)
        return;
      openDialog();
      console.log('softkeyLeftListener', name, this.verticalNavIndex);
    },
    softkeyRightListener: function(evt) {
      if (inputSoftwareKey)
        return;
      toastMessage();
      console.log('softkeyRightListener', name, this.verticalNavIndex);
    },
    enterListener: function(evt) {
      if (inputSoftwareKey)
        return;
      const navClasses = document.getElementsByClassName(navClass);
      if (navClasses[this.verticalNavIndex] != null) {
        navClasses[this.verticalNavIndex].click();
      }
      console.log('enterListener', name);
    },
    backspaceListener: function(evt) {
      console.log('backspaceListener', name);
    },
    arrowLeftListener: function(evt) {
      console.log('arrowLeftListener', name);
      const navClasses = document.getElementsByClassName(navClass);
      if (navClasses[this.verticalNavIndex] != null) {
        const dataKey = navClasses[this.verticalNavIndex].getAttribute('data-key');
        if (dataKey === 'linear-progress') {
          if (progressValue === 0)
            return;
          progressValue -= 10;
        } else if (dataKey === 'range-slider') {
          if (sliderValue === 0)
            return;
          sliderValue -= 10;
        }
      }
    },
    arrowRightListener: function(evt) {
      console.log('arrowRightListener', name);
      const navClasses = document.getElementsByClassName(navClass);
      if (navClasses[this.verticalNavIndex] != null) {
        const dataKey = navClasses[this.verticalNavIndex].getAttribute('data-key');
        if (dataKey === 'linear-progress') {
          if (progressValue === 100)
            return;
          progressValue += 10;
        } else if (dataKey === 'range-slider') {
          if (sliderValue === 100)
            return;
          sliderValue += 10;
        }
      }
    },
  };

  let navInstance = createKaiNavigator(navOptions);

  function onClickHandler(value) {
    goto(value);
  }

  function toastMessage(text = 'I\'m out after 2 second') {
    const t = new Toast({
      target: document.body,
      props: {
        options: {}
      }
    })
    Toaster.push(text , {
      dismissable: false,
      intro: { y: -64 },
      duration: 2000,
      onpop: () => {
        setTimeout(() => {
          t.$destroy();
        }, 4000);
      }
    })
  }

  function showLoadingBar() {
    loadingBar = new LoadingBar({
      target: document.body,
      props: {
        onOpened: () => {
          navInstance.detachListener();
          setTimeout(() => {
            loadingBar.$destroy();
          }, 3000);
        },
        onClosed: () => {
          navInstance.attachListener();
          loadingBar = null;
        }
      }
    });
  }

  function openDialog() {
    dialog = new Dialog({
      target: document.body,
      props: {
        title: 'Intro',
        body: `Svelte is a radical new approach to building user interfaces. Whereas traditional frameworks like React and Vue do the bulk of their work in the browser, Svelte shifts that work into a compile step that happens when you build your app. Instead of using techniques like virtual DOM diffing, Svelte writes code that surgically updates the DOM when the state of your app changes. We're proud that Svelte was recently voted the most loved web framework with the most satisfied developers in a pair of industry surveys. We think you'll love it too. Read the introductory blog post to learn more.`,
        softKeyCenterText: 'hide',
        onSoftkeyLeft: (evt) => {
          console.log('onSoftkeyLeft');
        },
        onSoftkeyRight: (evt) => {
          console.log('onSoftkeyRight');
        },
        onEnter: (evt) => {
          console.log('onEnter');
          dialog.$destroy();
        },
        onBackspace: (evt) => {
          console.log('onBackspace');
          evt.preventDefault();
          evt.stopPropagation();
          dialog.$destroy();
        },
        onOpened: () => {
          navInstance.detachListener();
        },
        onClosed: () => {
          navInstance.attachListener();
          dialog = null;
        }
      }
    });
  }

  function openOptionMenu() {
    optionMenu = new OptionMenu({
      target: document.body,
      props: {
        title: 'Option Menu',
        focusIndex: optionMenuIndex,
        options: [
          { title: 'Option Menu 0', subtitle: 'Option menu 0 subtitle' },
          { title: 'Option Menu 1', subtitle: 'Option menu 1 subtitle' },
          { title: 'Option Menu 2', subtitle: 'Option menu 2 subtitle' },
          { title: 'Option Menu 3', subtitle: 'Option menu 3 subtitle' },
          { title: 'Option Menu 4', subtitle: 'Option menu 4 subtitle' },
        ],
        softKeyCenterText: 'select',
        onSoftkeyRight: (evt, scope) => {
          console.log('onSoftkeyRight', scope);
        },
        onSoftkeyLeft: (evt, scope) => {
          console.log('onSoftkeyRight', scope);
        },
        onEnter: (evt, scope) => {
          console.log('onEnter', scope);
          optionMenuIndex = scope.index;
          optionMenu.$destroy();
        },
        onBackspace: (evt, scope) => {
          console.log('onBackspace', scope);
          evt.preventDefault();
          evt.stopPropagation();
          optionMenu.$destroy();
        },
        onOpened: () => {
          navInstance.detachListener();
        },
        onClosed: (scope) => {
          console.log(scope);
          navInstance.attachListener();
          optionMenu = null;
        }
      }
    });
  }

  function openSingleSelector() {
    const idx = singleSelectorOptions.findIndex((o) => {
      return o.selected;
    })
    singleSelector = new SingleSelector({
      target: document.body,
      props: {
        title: 'Single Selector',
        focusIndex: idx,
        options: singleSelectorOptions,
        softKeyCenterText: 'select',
        onEnter: (evt, scope) => {
          console.log('onEnter', scope);
          singleSelectorOptions = scope.options;
          evt.preventDefault();
          evt.stopPropagation();
          singleSelector.$destroy();
        },
        onBackspace: (evt, scope) => {
          console.log('onBackspace', scope);
          evt.preventDefault();
          evt.stopPropagation();
          singleSelector.$destroy();
        },
        onOpened: () => {
          navInstance.detachListener();
        },
        onClosed: (scope) => {
          console.log(scope);
          navInstance.attachListener();
          singleSelector = null;
        }
      }
    });
  }

  function openMultiSelector() {
    multiSelector = new MultiSelector({
      target: document.body,
      props: {
        title: 'Multi Selector',
        focusIndex: optionMenuIndex,
        options: JSON.parse(JSON.stringify(multiSelectorOptions)),
        softKeyLeftText: 'Cancel',
        softKeyRightText: 'Done',
        softKeyCenterTextSelect: 'select',
        softKeyCenterTextDeselect: 'deselect',
        onSoftkeyLeft: (evt, scope) => {
          console.log('onSoftkeyLeft', scope);
          evt.preventDefault();
          evt.stopPropagation();
          multiSelector.$destroy();
        },
        onSoftkeyRight: (evt, scope) => {
          console.log('onSoftkeyRight', scope);
          multiSelectorOptions = scope.options;
          evt.preventDefault();
          evt.stopPropagation();
          multiSelector.$destroy();
        },
        onBackspace: (evt, scope) => {
          console.log('onBackspace', scope);
          evt.preventDefault();
          evt.stopPropagation();
          multiSelector.$destroy();
        },
        onOpened: () => {
          navInstance.detachListener();
        },
        onClosed: (scope) => {
          console.log(scope);
          navInstance.attachListener();
          multiSelector = null;
        }
      }
    });
  }

  function openDatePicker() {
    datePicker = new DatePicker({
      target: document.body,
      props: {
        title: 'Date Picker',
        date: datePickerValue,
        softKeyLeftText: 'Cancel',
        softKeyCenterText: 'save',
        onSoftkeyLeft: (evt, date) => {
          console.log('onSoftkeyLeft', date);
          datePicker.$destroy();
        },
        onSoftkeyRight: (evt, date) => {
          console.log('onSoftkeyRight', date);
        },
        onEnter: (evt, date) => {
          console.log('onEnter', date);
          datePickerValue = date;
          datePicker.$destroy();
        },
        onBackspace: (evt, date) => {
          console.log('onBackspace', date);
          evt.preventDefault();
          evt.stopPropagation();
          datePicker.$destroy();
        },
        onOpened: () => {
          navInstance.detachListener();
        },
        onClosed: (date) => {
          console.log('onClosed', date);
          navInstance.attachListener();
          datePicker = null;
        }
      }
    });
  }

  function openTimePicker() {
    timePicker = new TimePicker({
      target: document.body,
      props: {
        title: 'Time Picker',
        date: datePickerValue,
        is12HourSystem: true,
        softKeyLeftText: 'Cancel',
        softKeyCenterText: 'save',
        onSoftkeyLeft: (evt, date) => {
          console.log('onSoftkeyLeft', date);
          timePicker.$destroy();
        },
        onSoftkeyRight: (evt, date) => {
          console.log('onSoftkeyRight', date);
        },
        onEnter: (evt, date) => {
          console.log('onEnter', date);
          datePickerValue = date;
          timePicker.$destroy();
        },
        onBackspace: (evt, date) => {
          console.log('onBackspace', date);
          evt.preventDefault();
          evt.stopPropagation();
          timePicker.$destroy();
        },
        onOpened: () => {
          navInstance.detachListener();
        },
        onClosed: (date) => {
          console.log('onClosed', date);
          navInstance.attachListener();
          timePicker = null;
        }
      }
    });
  }

  function openTextInputDialog() {
    textInputDialog = new TextInputDialog({
      target: document.body,
      props: {
        title: 'TextInputDialog',
        softKeyCenterText: 'ok',
        value: 'Value',
        placeholder: 'Placeholder',
        type: 'text',
        onSoftkeyLeft: (evt, value) => {
          console.log('onSoftkeyLeft', value);
        },
        onSoftkeyRight: (evt, value) => {
          console.log('onSoftkeyRight', value);
        },
        onEnter: (evt, value) => {
          console.log('onEnter', value);
          textInputDialog.$destroy();
        },
        onBackspace: (evt, value) => {
          console.log('onBackspace', value);
          evt.stopPropagation();
        },
        onOpened: () => {
          navInstance.detachListener();
        },
        onClosed: (value) => {
          console.log('onClosed', value)
          navInstance.attachListener();
          textInputDialog = null;
        }
      }
    });
  }

  function openTextAreaDialog() {
    textAreaDialog = new TextAreaDialog({
      target: document.body,
      props: {
        title: 'TextAreaDialog',
        softKeyCenterText: 'ok',
        value: 'Value',
        placeholder: 'Placeholder',
        type: 'text',
        rows: 3,
        onSoftkeyLeft: (evt, value) => {
          console.log('onSoftkeyLeft', value);
        },
        onSoftkeyRight: (evt, value) => {
          console.log('onSoftkeyRight', value);
        },
        onEnter: (evt, value) => {
          console.log('onEnter', value);
          textAreaDialog.$destroy();
        },
        onBackspace: (evt, value) => {
          console.log('onBackspace', value);
          evt.stopPropagation();
        },
        onOpened: () => {
          navInstance.detachListener();
        },
        onClosed: (value) => {
          console.log('onClosed', value)
          navInstance.attachListener();
          textAreaDialog = null;
        }
      }
    });
  }

  function onButtonClick(evt) {
    window.close();
  }

  function onInput(evt) {
    console.log('onInput');
  }

  function onFocus(evt) {
    console.log('onFocus');
    inputSoftwareKey = new SoftwareKey({
      target: document.body,
      props: {
        isInvert: true,
        leftText: 'X Dialog',
        centerText: 'X Enter',
        rightText: 'X Toast'
      }
    });
  }

  function onBlur(evt) {
    console.log('onBlur');
    if (inputSoftwareKey) {
      inputSoftwareKey.$destroy();
      inputSoftwareKey = null;
    }
  }

  function propagateClick(evt) {
    const keys = Object.keys(evt.target.children);
    for (var k in keys) {
      evt.target.children[k].click();
    }
  }

  function onRadioCheckboxChange(scope) {
    console.log(scope);
  }

  function changeLocale() {
    const idx = locales.findIndex((o) => {
      return o.subtitle === locale || 0;
    })
    localeMenu = new OptionMenu({
      target: document.body,
      props: {
        title: getAppProp().localization.lang('select_locale'),
        focusIndex: idx,
        options: locales,
        softKeyCenterText: 'select',
        onSoftkeyRight: (evt, scope) => {
          console.log('onSoftkeyRight', scope);
        },
        onSoftkeyLeft: (evt, scope) => {
          console.log('onSoftkeyRight', scope);
        },
        onEnter: (evt, scope) => {
          console.log('onEnter', scope);
          getAppProp().localization.loadLocale(scope.selected.subtitle);
          locale = getAppProp().localization.defaultLocale;
          localeMenu.$destroy();
        },
        onBackspace: (evt, scope) => {
          console.log('onBackspace', scope);
          evt.preventDefault();
          evt.stopPropagation();
          localeMenu.$destroy();
        },
        onOpened: () => {
          navInstance.detachListener();
        },
        onClosed: (scope) => {
          console.log(scope);
          navInstance.attachListener();
          localeMenu = null;
        }
      }
    });
  }

  onMount(() => {
    console.log('onMount', name);
    locale = getAppProp().localization.defaultLocale;
    const { appBar, softwareKey } = getAppProp();
    appBar.setTitleText(name);
    softwareKey.setText({ left: `Dialog L`, center: `${name} C`, right: `Toast R` });
    navInstance.attachListener();

    api.call('help.getNearestDc').then(result => {
        console.log('country:', result.country);
    });

  });

  onDestroy(() => {
    console.log('onDestroy', name);
    navInstance.detachListener();
  });

</script>

<main id="home-screen" data-pad-top="28" data-pad-bottom="30">
  <ListView className="{navClass}" title="{getAppProp().localization.langByLocale('hello', locale, 'Svelte')}" subtitle="Goto room screen" onClick={() => onClickHandler('room')}/>
  <ListView className="{navClass}" title="{getAppProp().localization.langByLocale('change_locale', locale)}" subtitle="{getAppProp().localization.langByLocale('change_locale_subtitle', locale)}" onClick={changeLocale}/>
  <Separator title="Progress" />
  <ListView className="{navClass}" title="Loading Bar" subtitle="Display loading bar & freeze keydown for 3 seconds" onClick={showLoadingBar} />
  <ListView key="linear-progress" className="{navClass}">
    <slot>
      <LinearProgress label="Linear Progress" value={progressValue} min={0} max={100} progressType={1}/>
    </slot>
    <span slot="rightWidget"></span>
  </ListView>
  <ListView key="range-slider" className="{navClass}">
    <slot>
      <RangeSlider label="Range Slider" value={sliderValue} min={0} max={100} progressType={2}/>
    </slot>
    <span slot="rightWidget"></span>
  </ListView>
  <Separator title="Dialog" />
  <ListView className="{navClass}" title="Option Menu" subtitle="Click to open option menu & focus on index {optionMenuIndex}" onClick={openOptionMenu}/>
  <ListView className="{navClass}" title="Single Selector" subtitle="Click to open single selector & focus on current" onClick={openSingleSelector}/>
  <ListView className="{navClass}" title="Multi Selector" subtitle="Click to open multi selector & focus on index {optionMenuIndex}" onClick={openMultiSelector}/>
  <Separator title="Input" />
  <TextInputField className="{navClass}" label="TextInput" placeholder="Placeholder" value="Value" type="text" {onInput} {onFocus} {onBlur} />
  <TextAreaField className="{navClass}" label="TextArea" placeholder="Placeholder" value="Value" type="text" rows={4} {onInput} {onFocus} {onBlur}/>
  <ListView className="{navClass}" title="Checkbox" subtitle="Please click me" onClick={propagateClick}>
    <Checkbox slot="rightWidget" key="checkbox" checked="{true}" onChange={onRadioCheckboxChange} />
  </ListView>
  <ListView className="{navClass}" title="Radio" subtitle="Please click me" onClick={propagateClick}>
    <Radio slot="rightWidget" key="radio" selected="{true}" onChange={onRadioCheckboxChange} />
  </ListView>
  <ListView className="{navClass}" title="Date Picker" subtitle="Click to open date picker, {datePickerValue.toDateString()}" onClick={openDatePicker}>
    <span slot="rightWidget" class="kai-icon-calendar" style="font-size:20px;"></span>
  </ListView>
  <ListView className="{navClass}" title="Time Picker" subtitle="Click to open time picker, {datePickerValue.toLocaleTimeString()}" onClick={openTimePicker}>
    <span slot="rightWidget" class="kai-icon-favorite-on" style="font-size:20px;"></span>
  </ListView>
  <ListView className="{navClass}" title="Text Input Dialog" subtitle="Open text input dialog" onClick={openTextInputDialog}>
    <span slot="rightWidget" class="kai-icon-search" style="font-size:20px;"></span>
  </ListView>
  <ListView className="{navClass}" title="Text Area Dialog" subtitle="Open text area dialog" onClick={openTextAreaDialog}>
    <span slot="rightWidget" class="kai-icon-message" style="font-size:20px;"></span>
  </ListView>
  <Button className="{navClass}" text="Exit" onClick={onButtonClick}>
    <span slot="leftWidget" class="kai-icon-arrow" style="margin:0px 5px;-moz-transform: scale(-1, 1);-webkit-transform: scale(-1, 1);-o-transform: scale(-1, 1);-ms-transform: scale(-1, 1);transform: scale(-1, 1);"></span>
    <span slot="rightWidget" class="kai-icon-arrow" style="margin:0px 5px;"></span>
  </Button>
</main>

<style>
  #home-screen {
    overflow: scroll;
    width: 100%;
  }
</style>
