import defBench from './defBench';
// https://github.com/bestiejs/benchmark.js/issues/128
import _ from 'lodash';
import process from 'process';

const benchmark = require('benchmark');
const Benchmark = benchmark.runInContext({_, process});
window.Benchmark = Benchmark;

module.exports = function (eruda) 
{
    let {evalCss, each, $, isArr} = eruda.util;

    class BenchmarkTool extends eruda.Tool {
        constructor() {
            super();
            this.name = 'benchmark';
            this._style = evalCss(require('./style.scss'));
            this._tpl = require('./template.hbs');

            this._benches = [];
        }
        init($el, container) 
        {
            super.init($el, container);

            this._addDefBench();
            this._bindEvent();
        }
        show() 
        {
            super.show();
        }
        hide()
        {
            super.hide();
        }
        destroy() 
        {
            super.destroy();
            evalCss.remove(this._style);
        }
        add(name, fn) 
        {
            return isArr(fn) ? this._addBenchSuite(name, fn) : this._addBench(name, fn);
        }
        _addBenchSuite(name, fns) 
        {
            let benches = this._benches;

            let self = this;

            let bench = {
                name,
                result: null,
                stores: [],
                status: 'ready'
            };

            let suite = new Benchmark.Suite(name, {
                onStart() 
                {
                    bench.status = 'running'; 
                    bench.stores = [];
                    bench.result = null;
                    self._render();                            
                },
                onCycle(e) 
                {
                    if (bench.status === 'error') return;
                    bench.stores.push(e.target);
                    bench.result = formatBenches(bench.stores);
                    self._updateResult(bench, bench.result);
                },
                onError(e) 
                {
                    bench.status = 'error';
                    bench.result = e.message.message;
                    self._render(); 
                },
                onAbort() 
                {
                    if (bench.status === 'error') return;
                    bench.status = 'abort';
                    self._render();
                },
                onComplete() 
                {
                    if (bench.status === 'error') return;
                    bench.status = 'complete';

                    bench.result = formatBenches(bench.stores);
                    self._render();
                }
            });

            each(fns, ({name, fn}) => suite.add(name, fn));

            bench.bench = suite;
            benches.push(bench);

            return this._render();
        }
        _addBench(name, fn) 
        {
            let benches = this._benches;

            let self = this;

            let bench = {
                bench: new Benchmark(name, fn, {
                    onStart() 
                    {
                        bench.status = 'running'; 
                        bench.result = null;
                        self._render();                            
                    },
                    onCycle() 
                    {
                        if (bench.status === 'error') return;
                        bench.result = formatBench(this);
                        self._updateResult(bench, bench.result);
                    },
                    onError(e) 
                    {
                        bench.status = 'error';
                        bench.result = e.message.message;
                        self._render(); 
                    },
                    onAbort() 
                    {
                        if (bench.status === 'error') return;
                        bench.status = 'abort';
                        self._render();
                    },
                    onComplete() 
                    {
                        if (bench.status === 'error') return;
                        bench.status = 'complete';

                        bench.result = formatBench(this);
                        self._render();
                    }
                }),
                name,
                result: null,
                status: 'ready'
            };
            benches.push(bench);

            return this._render();
        }
        remove(name) 
        {
            let benches = this._benches;

            for (let i = benches.length - 1; i >= 0; i--)
            {
                if (benches[i].name === name) benches.splice(i, 1);
            }

            return this._render();
        }
        clear() 
        {
            this._benches = [];

            return this._render();
        }
        run(name) 
        {
            let benches = this._benches;

            for (let i = 0, len = benches.length; i < len; i++) 
            {
                if (benches[i].name === name) this._run(i);
            }

            return this;
        }
        _render() 
        {
            let benches = this._benches;

            each(benches, bench => 
            {
                bench.isRunning = bench.status === 'running';
                bench.color = getStatusColor(bench.status);
            });

            this._$el.html(this._tpl({benches}));

            return this;
        }
        _run(idx) 
        {
            this._benches[idx].bench.run({async: true});
        }
        _updateResult(bench, result) 
        {
            let benches = this._benches;

            let i = 0;
            for (let len = benches.length; i < len; i++) 
            {
                if (benches[i] === bench) break;
            }

            this._$el.find(`.eruda-result[data-idx="${i}"]`).html(result);
        }
        _addDefBench() 
        {
            each(defBench, ({name, fn}) => this.add(name, fn));
        }
        _bindEvent() 
        {
            let self = this;

            this._$el.on('click', '.eruda-run', function () 
            {
                let idx = $(this).data('idx');

                self._run(idx);
            });
        }
    }

    return new BenchmarkTool();
};

function getStatusColor(status) 
{
    switch (status) 
    {
        case 'ready': return '#707d8b';
        case 'error': return '#f44336';
        case 'abort': return '#ffc107';
        case 'running': return '#009688';
        case 'complete': return '#2196f3';
    }
}

function formatBench(bench, name) 
{
    let {hz, stats} = bench;

    let ops = hz.toFixed(hz < 100 ? 2 : 0),
        deviation = stats.rme.toFixed(2),
        size = stats.sample.length;

    return `
        <div class="eruda-result-item">
            ${name ? '<div class="eruda-result-item-name">' + name + '</div>  x ' : ''}<div class="eruda-result-number">${ops}</div> ops/sec \xb1<div class="eruda-result-number">${deviation}</div>% (<div class="eruda-result-number">${size}</div> runs sampled)
        </div>
    `;
}

function formatBenches(benches) 
{
    let result = [];

    for (let i = 0, len = benches.length; i < len; i++) 
    {
        let bench = benches[i];
        result.push(formatBench(bench, bench.name));
    }

    return result.join('');
}
