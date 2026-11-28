// TinHocLab – Scratch 3 offline entry (scratch-gui 4.1.7, BSD-3-Clause)
import 'es6-object-assign/auto';
import 'core-js/fn/array/includes';
import 'core-js/fn/promise/finally';
import React from 'react';
import ReactDOM from 'react-dom';
import {compose} from 'redux';
import AppStateHOC from '../lib/app-state-hoc.jsx';
import GUI from '../containers/gui.jsx';
import HashParserHOC from '../lib/hash-parser-hoc.jsx';
import styles from './index.css';

const target = document.getElementById('scratch-root') || (() => {
    const d = document.createElement('div'); document.body.appendChild(d); return d;
})();
target.className = (target.className + ' ' + styles.app).trim();
GUI.setAppElement(target);
const Wrapped = compose(AppStateHOC, HashParserHOC)(GUI);
const onVmInit = vm => {
    window.vm = vm;
    window.dispatchEvent(new CustomEvent('thl-vm', {detail: vm}));
};
ReactDOM.render(
    <Wrapped
        basePath={window.THL_SCRATCH_BASE || './'}
        logo={window.THL_SCRATCH_LOGO}
        onClickLogo={() => window.dispatchEvent(new Event('thl-logo'))}
        isScratchDesktop
        canEditTitle
        canSave={false}
        showTelemetryModal={false}
        backpackVisible={false}
        showComingSoon={false}
        onVmInit={onVmInit}
    />,
    target
);
