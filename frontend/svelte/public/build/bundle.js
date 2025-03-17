
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function self(fn) {
        return function (event) {
            // @ts-ignore
            if (event.target === this)
                fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    /**
     * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
     * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
     * it can be called from an external module).
     *
     * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
     *
     * https://svelte.dev/docs#run-time-svelte-onmount
     */
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    /**
     * Schedules a callback to run immediately after the component has been updated.
     *
     * The first time the callback runs will be after the initial `onMount`
     */
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    /**
     * Schedules a callback to run immediately before the component is unmounted.
     *
     * Out of `onMount`, `beforeUpdate`, `afterUpdate` and `onDestroy`, this is the
     * only one that runs inside a server-side component.
     *
     * https://svelte.dev/docs#run-time-svelte-ondestroy
     */
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    /**
     * Creates an event dispatcher that can be used to dispatch [component events](/docs#template-syntax-component-directives-on-eventname).
     * Event dispatchers are functions that can take two arguments: `name` and `detail`.
     *
     * Component events created with `createEventDispatcher` create a
     * [CustomEvent](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent).
     * These events do not [bubble](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_bubbling_and_capture).
     * The `detail` argument corresponds to the [CustomEvent.detail](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/detail)
     * property and can contain any type of data.
     *
     * https://svelte.dev/docs#run-time-svelte-createeventdispatcher
     */
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
                return !event.defaultPrevented;
            }
            return true;
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function each(items, fn) {
        let str = '';
        for (let i = 0; i < items.length; i += 1) {
            str += fn(items[i], i);
        }
        return str;
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    function construct_svelte_component_dev(component, props) {
        const error_message = 'this={...} of <svelte:component> should specify a Svelte component.';
        try {
            const instance = new component(props);
            if (!instance.$$ || !instance.$set || !instance.$on || !instance.$destroy) {
                throw new Error(error_message);
            }
            return instance;
        }
        catch (err) {
            const { message } = err;
            if (typeof message === 'string' && message.indexOf('is not a constructor') !== -1) {
                throw new Error(error_message);
            }
            else {
                throw err;
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier} [start]
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=} start
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0 && stop) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let started = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (started) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            started = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
                // We need to set this to false because callbacks can still happen despite having unsubscribed:
                // Callbacks might already be placed in the queue which doesn't know it should no longer
                // invoke this derived store.
                started = false;
            };
        });
    }

    function parse(str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules/svelte-spa-router/Router.svelte generated by Svelte v3.59.2 */

    const { Error: Error_1, Object: Object_1$1, console: console_1$2 } = globals;

    // (246:0) {:else}
    function create_else_block$1(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = construct_svelte_component_dev(switch_value, switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) mount_component(switch_instance, target, anchor);
    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*props*/ 4)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*props*/ ctx[2])])
    			: {};

    			if (dirty & /*component*/ 1 && switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = construct_svelte_component_dev(switch_value, switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(246:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (239:0) {#if componentParams}
    function create_if_block$3(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [{ params: /*componentParams*/ ctx[1] }, /*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = construct_svelte_component_dev(switch_value, switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) mount_component(switch_instance, target, anchor);
    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*componentParams, props*/ 6)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*componentParams*/ 2 && { params: /*componentParams*/ ctx[1] },
    					dirty & /*props*/ 4 && get_spread_object(/*props*/ ctx[2])
    				])
    			: {};

    			if (dirty & /*component*/ 1 && switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = construct_svelte_component_dev(switch_value, switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(239:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$3, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*componentParams*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function getLocation() {
    	const hashPosition = window.location.href.indexOf('#/');

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: '/';

    	// Check if there's a querystring
    	const qsPosition = location.indexOf('?');

    	let querystring = '';

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(null, // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
    	set(getLocation());

    	const update = () => {
    		set(getLocation());
    	};

    	window.addEventListener('hashchange', update, false);

    	return function stop() {
    		window.removeEventListener('hashchange', update, false);
    	};
    });

    const location = derived(loc, _loc => _loc.location);
    const querystring = derived(loc, _loc => _loc.querystring);
    const params = writable(undefined);

    async function push(location) {
    	if (!location || location.length < 1 || location.charAt(0) != '/' && location.indexOf('#/') !== 0) {
    		throw Error('Invalid parameter location');
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	// Note: this will include scroll state in history even when restoreScrollState is false
    	history.replaceState(
    		{
    			...history.state,
    			__svelte_spa_router_scrollX: window.scrollX,
    			__svelte_spa_router_scrollY: window.scrollY
    		},
    		undefined
    	);

    	window.location.hash = (location.charAt(0) == '#' ? '' : '#') + location;
    }

    async function pop() {
    	// Execute this code when the current call stack is complete
    	await tick();

    	window.history.back();
    }

    async function replace(location) {
    	if (!location || location.length < 1 || location.charAt(0) != '/' && location.indexOf('#/') !== 0) {
    		throw Error('Invalid parameter location');
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	const dest = (location.charAt(0) == '#' ? '' : '#') + location;

    	try {
    		const newState = { ...history.state };
    		delete newState['__svelte_spa_router_scrollX'];
    		delete newState['__svelte_spa_router_scrollY'];
    		window.history.replaceState(newState, undefined, dest);
    	} catch(e) {
    		// eslint-disable-next-line no-console
    		console.warn('Caught exception while replacing the current page. If you\'re running this in the Svelte REPL, please note that the `replace` method might not work in this environment.');
    	}

    	// The method above doesn't trigger the hashchange event, so let's do that manually
    	window.dispatchEvent(new Event('hashchange'));
    }

    function link(node, opts) {
    	opts = linkOpts(opts);

    	// Only apply to <a> tags
    	if (!node || !node.tagName || node.tagName.toLowerCase() != 'a') {
    		throw Error('Action "link" can only be used with <a> tags');
    	}

    	updateLink(node, opts);

    	return {
    		update(updated) {
    			updated = linkOpts(updated);
    			updateLink(node, updated);
    		}
    	};
    }

    function restoreScroll(state) {
    	// If this exists, then this is a back navigation: restore the scroll position
    	if (state) {
    		window.scrollTo(state.__svelte_spa_router_scrollX, state.__svelte_spa_router_scrollY);
    	} else {
    		// Otherwise this is a forward navigation: scroll to top
    		window.scrollTo(0, 0);
    	}
    }

    // Internal function used by the link function
    function updateLink(node, opts) {
    	let href = opts.href || node.getAttribute('href');

    	// Destination must start with '/' or '#/'
    	if (href && href.charAt(0) == '/') {
    		// Add # to the href attribute
    		href = '#' + href;
    	} else if (!href || href.length < 2 || href.slice(0, 2) != '#/') {
    		throw Error('Invalid value for "href" attribute: ' + href);
    	}

    	node.setAttribute('href', href);

    	node.addEventListener('click', event => {
    		// Prevent default anchor onclick behaviour
    		event.preventDefault();

    		if (!opts.disabled) {
    			scrollstateHistoryHandler(event.currentTarget.getAttribute('href'));
    		}
    	});
    }

    // Internal function that ensures the argument of the link action is always an object
    function linkOpts(val) {
    	if (val && typeof val == 'string') {
    		return { href: val };
    	} else {
    		return val || {};
    	}
    }

    /**
     * The handler attached to an anchor tag responsible for updating the
     * current history state with the current scroll state
     *
     * @param {string} href - Destination
     */
    function scrollstateHistoryHandler(href) {
    	// Setting the url (3rd arg) to href will break clicking for reasons, so don't try to do that
    	history.replaceState(
    		{
    			...history.state,
    			__svelte_spa_router_scrollX: window.scrollX,
    			__svelte_spa_router_scrollY: window.scrollY
    		},
    		undefined
    	);

    	// This will force an update as desired, but this time our scroll state will be attached
    	window.location.hash = href;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Router', slots, []);
    	let { routes = {} } = $$props;
    	let { prefix = '' } = $$props;
    	let { restoreScrollState = false } = $$props;

    	/**
     * Container for a route: path, component
     */
    	class RouteItem {
    		/**
     * Initializes the object and creates a regular expression from the path, using regexparam.
     *
     * @param {string} path - Path to the route (must start with '/' or '*')
     * @param {SvelteComponent|WrappedComponent} component - Svelte component for the route, optionally wrapped
     */
    		constructor(path, component) {
    			if (!component || typeof component != 'function' && (typeof component != 'object' || component._sveltesparouter !== true)) {
    				throw Error('Invalid component object');
    			}

    			// Path must be a regular or expression, or a string starting with '/' or '*'
    			if (!path || typeof path == 'string' && (path.length < 1 || path.charAt(0) != '/' && path.charAt(0) != '*') || typeof path == 'object' && !(path instanceof RegExp)) {
    				throw Error('Invalid value for "path" argument - strings must start with / or *');
    			}

    			const { pattern, keys } = parse(path);
    			this.path = path;

    			// Check if the component is wrapped and we have conditions
    			if (typeof component == 'object' && component._sveltesparouter === true) {
    				this.component = component.component;
    				this.conditions = component.conditions || [];
    				this.userData = component.userData;
    				this.props = component.props || {};
    			} else {
    				// Convert the component to a function that returns a Promise, to normalize it
    				this.component = () => Promise.resolve(component);

    				this.conditions = [];
    				this.props = {};
    			}

    			this._pattern = pattern;
    			this._keys = keys;
    		}

    		/**
     * Checks if `path` matches the current route.
     * If there's a match, will return the list of parameters from the URL (if any).
     * In case of no match, the method will return `null`.
     *
     * @param {string} path - Path to test
     * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
     */
    		match(path) {
    			// If there's a prefix, check if it matches the start of the path.
    			// If not, bail early, else remove it before we run the matching.
    			if (prefix) {
    				if (typeof prefix == 'string') {
    					if (path.startsWith(prefix)) {
    						path = path.substr(prefix.length) || '/';
    					} else {
    						return null;
    					}
    				} else if (prefix instanceof RegExp) {
    					const match = path.match(prefix);

    					if (match && match[0]) {
    						path = path.substr(match[0].length) || '/';
    					} else {
    						return null;
    					}
    				}
    			}

    			// Check if the pattern matches
    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			// If the input was a regular expression, this._keys would be false, so return matches as is
    			if (this._keys === false) {
    				return matches;
    			}

    			const out = {};
    			let i = 0;

    			while (i < this._keys.length) {
    				// In the match parameters, URL-decode all values
    				try {
    					out[this._keys[i]] = decodeURIComponent(matches[i + 1] || '') || null;
    				} catch(e) {
    					out[this._keys[i]] = null;
    				}

    				i++;
    			}

    			return out;
    		}

    		/**
     * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoading`, `routeLoaded` and `conditionsFailed` events
     * @typedef {Object} RouteDetail
     * @property {string|RegExp} route - Route matched as defined in the route definition (could be a string or a reguar expression object)
     * @property {string} location - Location path
     * @property {string} querystring - Querystring from the hash
     * @property {object} [userData] - Custom data passed by the user
     * @property {SvelteComponent} [component] - Svelte component (only in `routeLoaded` events)
     * @property {string} [name] - Name of the Svelte component (only in `routeLoaded` events)
     */
    		/**
     * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
     * 
     * @param {RouteDetail} detail - Route detail
     * @returns {boolean} Returns true if all the conditions succeeded
     */
    		async checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!await this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	// Set up all routes
    	const routesList = [];

    	if (routes instanceof Map) {
    		// If it's a map, iterate on it right away
    		routes.forEach((route, path) => {
    			routesList.push(new RouteItem(path, route));
    		});
    	} else {
    		// We have an object, so iterate on its own properties
    		Object.keys(routes).forEach(path => {
    			routesList.push(new RouteItem(path, routes[path]));
    		});
    	}

    	// Props for the component to render
    	let component = null;

    	let componentParams = null;
    	let props = {};

    	// Event dispatcher from Svelte
    	const dispatch = createEventDispatcher();

    	// Just like dispatch, but executes on the next iteration of the event loop
    	async function dispatchNextTick(name, detail) {
    		// Execute this code when the current call stack is complete
    		await tick();

    		dispatch(name, detail);
    	}

    	// If this is set, then that means we have popped into this var the state of our last scroll position
    	let previousScrollState = null;

    	let popStateChanged = null;

    	if (restoreScrollState) {
    		popStateChanged = event => {
    			// If this event was from our history.replaceState, event.state will contain
    			// our scroll history. Otherwise, event.state will be null (like on forward
    			// navigation)
    			if (event.state && (event.state.__svelte_spa_router_scrollY || event.state.__svelte_spa_router_scrollX)) {
    				previousScrollState = event.state;
    			} else {
    				previousScrollState = null;
    			}
    		};

    		// This is removed in the destroy() invocation below
    		window.addEventListener('popstate', popStateChanged);

    		afterUpdate(() => {
    			restoreScroll(previousScrollState);
    		});
    	}

    	// Always have the latest value of loc
    	let lastLoc = null;

    	// Current object of the component loaded
    	let componentObj = null;

    	// Handle hash change events
    	// Listen to changes in the $loc store and update the page
    	// Do not use the $: syntax because it gets triggered by too many things
    	const unsubscribeLoc = loc.subscribe(async newLoc => {
    		lastLoc = newLoc;

    		// Find a route matching the location
    		let i = 0;

    		while (i < routesList.length) {
    			const match = routesList[i].match(newLoc.location);

    			if (!match) {
    				i++;
    				continue;
    			}

    			const detail = {
    				route: routesList[i].path,
    				location: newLoc.location,
    				querystring: newLoc.querystring,
    				userData: routesList[i].userData,
    				params: match && typeof match == 'object' && Object.keys(match).length
    				? match
    				: null
    			};

    			// Check if the route can be loaded - if all conditions succeed
    			if (!await routesList[i].checkConditions(detail)) {
    				// Don't display anything
    				$$invalidate(0, component = null);

    				componentObj = null;

    				// Trigger an event to notify the user, then exit
    				dispatchNextTick('conditionsFailed', detail);

    				return;
    			}

    			// Trigger an event to alert that we're loading the route
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick('routeLoading', Object.assign({}, detail));

    			// If there's a component to show while we're loading the route, display it
    			const obj = routesList[i].component;

    			// Do not replace the component if we're loading the same one as before, to avoid the route being unmounted and re-mounted
    			if (componentObj != obj) {
    				if (obj.loading) {
    					$$invalidate(0, component = obj.loading);
    					componentObj = obj;
    					$$invalidate(1, componentParams = obj.loadingParams);
    					$$invalidate(2, props = {});

    					// Trigger the routeLoaded event for the loading component
    					// Create a copy of detail so we don't modify the object for the dynamic route (and the dynamic route doesn't modify our object too)
    					dispatchNextTick('routeLoaded', Object.assign({}, detail, {
    						component,
    						name: component.name,
    						params: componentParams
    					}));
    				} else {
    					$$invalidate(0, component = null);
    					componentObj = null;
    				}

    				// Invoke the Promise
    				const loaded = await obj();

    				// Now that we're here, after the promise resolved, check if we still want this component, as the user might have navigated to another page in the meanwhile
    				if (newLoc != lastLoc) {
    					// Don't update the component, just exit
    					return;
    				}

    				// If there is a "default" property, which is used by async routes, then pick that
    				$$invalidate(0, component = loaded && loaded.default || loaded);

    				componentObj = obj;
    			}

    			// Set componentParams only if we have a match, to avoid a warning similar to `<Component> was created with unknown prop 'params'`
    			// Of course, this assumes that developers always add a "params" prop when they are expecting parameters
    			if (match && typeof match == 'object' && Object.keys(match).length) {
    				$$invalidate(1, componentParams = match);
    			} else {
    				$$invalidate(1, componentParams = null);
    			}

    			// Set static props, if any
    			$$invalidate(2, props = routesList[i].props);

    			// Dispatch the routeLoaded event then exit
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick('routeLoaded', Object.assign({}, detail, {
    				component,
    				name: component.name,
    				params: componentParams
    			})).then(() => {
    				params.set(componentParams);
    			});

    			return;
    		}

    		// If we're still here, there was no match, so show the empty component
    		$$invalidate(0, component = null);

    		componentObj = null;
    		params.set(undefined);
    	});

    	onDestroy(() => {
    		unsubscribeLoc();
    		popStateChanged && window.removeEventListener('popstate', popStateChanged);
    	});

    	const writable_props = ['routes', 'prefix', 'restoreScrollState'];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$2.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	function routeEvent_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function routeEvent_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ('routes' in $$props) $$invalidate(3, routes = $$props.routes);
    		if ('prefix' in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ('restoreScrollState' in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    	};

    	$$self.$capture_state = () => ({
    		readable,
    		writable,
    		derived,
    		tick,
    		getLocation,
    		loc,
    		location,
    		querystring,
    		params,
    		push,
    		pop,
    		replace,
    		link,
    		restoreScroll,
    		updateLink,
    		linkOpts,
    		scrollstateHistoryHandler,
    		onDestroy,
    		createEventDispatcher,
    		afterUpdate,
    		parse,
    		routes,
    		prefix,
    		restoreScrollState,
    		RouteItem,
    		routesList,
    		component,
    		componentParams,
    		props,
    		dispatch,
    		dispatchNextTick,
    		previousScrollState,
    		popStateChanged,
    		lastLoc,
    		componentObj,
    		unsubscribeLoc
    	});

    	$$self.$inject_state = $$props => {
    		if ('routes' in $$props) $$invalidate(3, routes = $$props.routes);
    		if ('prefix' in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ('restoreScrollState' in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    		if ('component' in $$props) $$invalidate(0, component = $$props.component);
    		if ('componentParams' in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    		if ('props' in $$props) $$invalidate(2, props = $$props.props);
    		if ('previousScrollState' in $$props) previousScrollState = $$props.previousScrollState;
    		if ('popStateChanged' in $$props) popStateChanged = $$props.popStateChanged;
    		if ('lastLoc' in $$props) lastLoc = $$props.lastLoc;
    		if ('componentObj' in $$props) componentObj = $$props.componentObj;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*restoreScrollState*/ 32) {
    			// Update history.scrollRestoration depending on restoreScrollState
    			history.scrollRestoration = restoreScrollState ? 'manual' : 'auto';
    		}
    	};

    	return [
    		component,
    		componentParams,
    		props,
    		routes,
    		prefix,
    		restoreScrollState,
    		routeEvent_handler,
    		routeEvent_handler_1
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
    			routes: 3,
    			prefix: 4,
    			restoreScrollState: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get routes() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get restoreScrollState() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set restoreScrollState(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const getUser = async () => {
      const response = await fetch("http://localhost:5000/api/user", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch the user.");
      }

      const { nickname } = await response.json();
      return nickname;
    };

    const generateBoard = async () => {
      //
      const response = await fetch("http://localhost:5000/api/board", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          difficulty: "medium",
        }),
      });

      //
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch the board.");
      }

      //
      const gameBoard = await response.json();
      return gameBoard;
    };

    const flagCell = async (rowKey, colKey, gameBoard) => {
      const response = await fetch("http://localhost:5000/api/action", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          row: rowKey,
          col: colKey,
          action: "flag",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch the updated board.");
      }

      const updatedBoard = await response.json();
      return updatedBoard;
    };

    const revealCell = async (rowKey, colKey, gameBoard) => {
      const response = await fetch("http://localhost:5000/api/action", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          row: rowKey,
          col: colKey,
          action: "reveal",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch the updated board.");
      }

      const updatedBoard = await response.json();
      return updatedBoard;
    };

    const changeDifficulty = async (difficulty) => {
      const response = await fetch("http://localhost:5000/api/reset", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          difficulty: difficulty,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch the board.");
      }

      const gameBoard = await response.json();
      return gameBoard;
    };

    const sendTime = async (time, diff) => {
      try {
        console.log(time,diff);
        const response = await fetch("http://localhost:5000/api/leaderboard",
          {
            method: "PATCH",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              elapsedTime: time,
              difficulty: diff,
            }),
          }
        );

        if (!response.ok) {
          console.error("Failed to send data to the leaderboard");
        } else {
          console.log("Time successfully sent to the leaderboard");
        }
      } catch (error) {
        console.error("Error sending data to the backend:", error);
      }
    };

    const saveTime = async (elapsedTime) => {
        const response = await fetch("http://localhost:5000/api/time", {
            method: "POST",
            credentials: "include",
            headers: {
            "Content-Type": "application/json",
            },
            body: JSON.stringify({ time: elapsedTime }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to fetch the board.");
          }
    };

    const getChat = async () => {
        try {
          const response = await fetch("http://localhost:5000/api/chat");
          const data = await response.json();
        //   console.log(data);
          const sortedMessages = data.sort(
            (a, b) => a.timestamp.seconds - b.timestamp.seconds
          );
          return sortedMessages;
        //   setMessages(sortedMessages); // Update the state with the fetched messages
        } catch (error) {
          console.error("Error fetching messages:", error);
        }
      };

    const sendMessage = async (message) => {
        try {
            const response = await fetch("http://localhost:5000/api/chat", {
            method: "PATCH",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ message }),
            });

            if (response.ok) {
            console.log("Message sent successfully");
            } else {
            console.error("Failed to send message", await response.json());
            }
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    /* src/routes/game.svelte generated by Svelte v3.59.2 */

    const { console: console_1$1 } = globals;
    const file$5 = "src/routes/game.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[43] = list[i];
    	child_ctx[45] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[46] = list[i];
    	child_ctx[48] = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[49] = list[i];
    	return child_ctx;
    }

    // (285:0) {#if showChat}
    function create_if_block_12(ctx) {
    	let div5;
    	let div4;
    	let div1;
    	let div0;
    	let t1;
    	let button0;
    	let t3;
    	let div2;
    	let t4;
    	let div3;
    	let input;
    	let t5;
    	let button1;
    	let mounted;
    	let dispose;
    	let each_value_2 = /*chat*/ ctx[0];
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div4 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			div0.textContent = "Welcome to the game chat!";
    			t1 = space();
    			button0 = element("button");
    			button0.textContent = "X";
    			t3 = space();
    			div2 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t4 = space();
    			div3 = element("div");
    			input = element("input");
    			t5 = space();
    			button1 = element("button");
    			button1.textContent = "send";
    			attr_dev(div0, "class", "greet svelte-1c2ysk8");
    			add_location(div0, file$5, 288, 16, 8025);
    			attr_dev(button0, "class", "x-btn svelte-1c2ysk8");
    			add_location(button0, file$5, 289, 16, 8092);
    			attr_dev(div1, "class", "chatheader svelte-1c2ysk8");
    			add_location(div1, file$5, 287, 12, 7984);
    			attr_dev(div2, "class", "chatbox svelte-1c2ysk8");
    			add_location(div2, file$5, 291, 12, 8178);
    			attr_dev(input, "class", "messageinput svelte-1c2ysk8");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "message");
    			add_location(input, file$5, 300, 16, 8595);
    			attr_dev(button1, "class", "send-btn svelte-1c2ysk8");
    			add_location(button1, file$5, 301, 16, 8720);
    			attr_dev(div3, "class", "chatfooter svelte-1c2ysk8");
    			add_location(div3, file$5, 299, 12, 8554);
    			attr_dev(div4, "class", "chatcontainer svelte-1c2ysk8");
    			add_location(div4, file$5, 286, 8, 7918);
    			attr_dev(div5, "class", "backdrop svelte-1c2ysk8");
    			add_location(div5, file$5, 285, 4, 7834);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div4);
    			append_dev(div4, div1);
    			append_dev(div1, div0);
    			append_dev(div1, t1);
    			append_dev(div1, button0);
    			append_dev(div4, t3);
    			append_dev(div4, div2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div2, null);
    				}
    			}

    			append_dev(div4, t4);
    			append_dev(div4, div3);
    			append_dev(div3, input);
    			set_input_value(input, /*message*/ ctx[11]);
    			append_dev(div3, t5);
    			append_dev(div3, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*toggleChat*/ ctx[19], false, false, false, false),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[22]),
    					listen_dev(input, "keydown", /*handleEnter*/ ctx[21], false, false, false, false),
    					listen_dev(button1, "click", /*handleSubmit*/ ctx[20], false, false, false, false),
    					listen_dev(div4, "keydown", /*handleEscape*/ ctx[18], false, false, false, false),
    					listen_dev(div5, "click", self(/*toggleChat*/ ctx[19]), false, false, false, false),
    					listen_dev(div5, "keydown", /*handleEscape*/ ctx[18], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*chat*/ 1) {
    				each_value_2 = /*chat*/ ctx[0];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div2, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_2.length;
    			}

    			if (dirty[0] & /*message*/ 2048 && input.value !== /*message*/ ctx[11]) {
    				set_input_value(input, /*message*/ ctx[11]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_12.name,
    		type: "if",
    		source: "(285:0) {#if showChat}",
    		ctx
    	});

    	return block;
    }

    // (293:16) {#each chat as messages}
    function create_each_block_2(ctx) {
    	let div0;
    	let t0_value = /*messages*/ ctx[49].sender + "";
    	let t0;
    	let t1;
    	let t2;
    	let div1;
    	let t3_value = /*messages*/ ctx[49].content + "";
    	let t3;
    	let t4;
    	let div2;
    	let t5_value = new Date(/*messages*/ ctx[49].timestamp.seconds * 1000).toUTCString() + "";
    	let t5;
    	let t6;
    	let br;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = text(":");
    			t2 = space();
    			div1 = element("div");
    			t3 = text(t3_value);
    			t4 = space();
    			div2 = element("div");
    			t5 = text(t5_value);
    			t6 = space();
    			br = element("br");
    			attr_dev(div0, "class", "name svelte-1c2ysk8");
    			add_location(div0, file$5, 293, 20, 8261);
    			attr_dev(div1, "class", "message svelte-1c2ysk8");
    			add_location(div1, file$5, 294, 20, 8324);
    			attr_dev(div2, "class", "date svelte-1c2ysk8");
    			add_location(div2, file$5, 295, 20, 8390);
    			add_location(br, file$5, 296, 20, 8494);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, t0);
    			append_dev(div0, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, t3);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, t5);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, br, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*chat*/ 1 && t0_value !== (t0_value = /*messages*/ ctx[49].sender + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*chat*/ 1 && t3_value !== (t3_value = /*messages*/ ctx[49].content + "")) set_data_dev(t3, t3_value);
    			if (dirty[0] & /*chat*/ 1 && t5_value !== (t5_value = new Date(/*messages*/ ctx[49].timestamp.seconds * 1000).toUTCString() + "")) set_data_dev(t5, t5_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(br);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(293:16) {#each chat as messages}",
    		ctx
    	});

    	return block;
    }

    // (318:12) {#if gameWon || gameLost}
    function create_if_block_11(ctx) {
    	let div;
    	let t0;
    	let br0;
    	let t1;
    	let br1;
    	let t2;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text("Y");
    			br0 = element("br");
    			t1 = text("O");
    			br1 = element("br");
    			t2 = text("U");
    			add_location(br0, file$5, 318, 40, 9276);
    			add_location(br1, file$5, 318, 45, 9281);
    			attr_dev(div, "class", "sidelabel svelte-1c2ysk8");
    			add_location(div, file$5, 318, 16, 9252);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, br0);
    			append_dev(div, t1);
    			append_dev(div, br1);
    			append_dev(div, t2);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_11.name,
    		type: "if",
    		source: "(318:12) {#if gameWon || gameLost}",
    		ctx
    	});

    	return block;
    }

    // (376:16) {:else}
    function create_else_block_4(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "loading gameboard";
    			attr_dev(div, "class", "nick svelte-1c2ysk8");
    			add_location(div, file$5, 376, 20, 13003);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_4.name,
    		type: "else",
    		source: "(376:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (322:16) {#if gameboard}
    function create_if_block_2$2(ctx) {
    	let each_1_anchor;
    	let each_value = /*gameboard*/ ctx[1].board;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(target, anchor);
    				}
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*gameboard, handleRightClick, handleLeftClick*/ 12290) {
    				each_value = /*gameboard*/ ctx[1].board;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(322:16) {#if gameboard}",
    		ctx
    	});

    	return block;
    }

    // (364:32) {:else}
    function create_else_block_3(ctx) {
    	let button;
    	let button_class_value;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[27](/*rowIndex*/ ctx[45], /*colIndex*/ ctx[48]);
    	}

    	function contextmenu_handler_3(...args) {
    		return /*contextmenu_handler_3*/ ctx[28](/*rowIndex*/ ctx[45], /*colIndex*/ ctx[48], ...args);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");

    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(/*gameboard*/ ctx[1].difficulty == 'hard'
    			? "lightcellsmall"
    			: "lightcellbig") + " svelte-1c2ysk8"));

    			attr_dev(button, "aria-label", "emptycell");
    			add_location(button, file$5, 364, 36, 12362);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", click_handler_1, false, false, false, false),
    					listen_dev(button, "contextmenu", contextmenu_handler_3, false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*gameboard*/ 2 && button_class_value !== (button_class_value = "" + (null_to_empty(/*gameboard*/ ctx[1].difficulty == 'hard'
    			? "lightcellsmall"
    			: "lightcellbig") + " svelte-1c2ysk8"))) {
    				attr_dev(button, "class", button_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_3.name,
    		type: "else",
    		source: "(364:32) {:else}",
    		ctx
    	});

    	return block;
    }

    // (358:58) 
    function create_if_block_9(ctx) {
    	let if_block_anchor;

    	function select_block_type_4(ctx, dirty) {
    		if (/*cell*/ ctx[46].value == 0) return create_if_block_10;
    		return create_else_block_2;
    	}

    	let current_block_type = select_block_type_4(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_4(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9.name,
    		type: "if",
    		source: "(358:58) ",
    		ctx
    	});

    	return block;
    }

    // (349:32) {#if cell.isFlagged}
    function create_if_block_7(ctx) {
    	let if_block_anchor;

    	function select_block_type_3(ctx, dirty) {
    		if (/*gameboard*/ ctx[1].status.isLost) return create_if_block_8;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type_3(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_3(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(349:32) {#if cell.isFlagged}",
    		ctx
    	});

    	return block;
    }

    // (327:28) {#if cell.value == -1}
    function create_if_block_3$1(ctx) {
    	let if_block_anchor;

    	function select_block_type_2(ctx, dirty) {
    		if (/*cell*/ ctx[46].isFlagged) return create_if_block_4;
    		if (/*cell*/ ctx[46].isRevealed) return create_if_block_5;
    		if (/*gameboard*/ ctx[1].status.isLost) return create_if_block_6;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type_2(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_2(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(327:28) {#if cell.value == -1}",
    		ctx
    	});

    	return block;
    }

    // (361:36) {:else}
    function create_else_block_2(ctx) {
    	let button;
    	let t_value = /*cell*/ ctx[46].value + "";
    	let t;
    	let button_class_value;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(t_value);

    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(/*gameboard*/ ctx[1].difficulty == 'hard'
    			? "darkcellsmall"
    			: "darkcellbig") + " svelte-1c2ysk8"));

    			add_location(button, file$5, 361, 40, 12141);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*gameboard*/ 2 && t_value !== (t_value = /*cell*/ ctx[46].value + "")) set_data_dev(t, t_value);

    			if (dirty[0] & /*gameboard*/ 2 && button_class_value !== (button_class_value = "" + (null_to_empty(/*gameboard*/ ctx[1].difficulty == 'hard'
    			? "darkcellsmall"
    			: "darkcellbig") + " svelte-1c2ysk8"))) {
    				attr_dev(button, "class", button_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2.name,
    		type: "else",
    		source: "(361:36) {:else}",
    		ctx
    	});

    	return block;
    }

    // (359:36) {#if cell.value == 0}
    function create_if_block_10(ctx) {
    	let button;
    	let button_class_value;

    	const block = {
    		c: function create() {
    			button = element("button");

    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(/*gameboard*/ ctx[1].difficulty == 'hard'
    			? "zerodarksmall"
    			: "zerodarkbig") + " svelte-1c2ysk8"));

    			attr_dev(button, "aria-label", "emptycell");
    			add_location(button, file$5, 359, 40, 11943);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*gameboard*/ 2 && button_class_value !== (button_class_value = "" + (null_to_empty(/*gameboard*/ ctx[1].difficulty == 'hard'
    			? "zerodarksmall"
    			: "zerodarkbig") + " svelte-1c2ysk8"))) {
    				attr_dev(button, "class", button_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_10.name,
    		type: "if",
    		source: "(359:36) {#if cell.value == 0}",
    		ctx
    	});

    	return block;
    }

    // (352:36) {:else}
    function create_else_block_1(ctx) {
    	let button;
    	let t;
    	let button_class_value;
    	let mounted;
    	let dispose;

    	function contextmenu_handler_2(...args) {
    		return /*contextmenu_handler_2*/ ctx[26](/*rowIndex*/ ctx[45], /*colIndex*/ ctx[48], ...args);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text("🚩");

    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(/*gameboard*/ ctx[1].difficulty == 'hard'
    			? "lightcellsmall"
    			: "lightcellbig") + " svelte-1c2ysk8"));

    			add_location(button, file$5, 352, 40, 11448);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "contextmenu", contextmenu_handler_2, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*gameboard*/ 2 && button_class_value !== (button_class_value = "" + (null_to_empty(/*gameboard*/ ctx[1].difficulty == 'hard'
    			? "lightcellsmall"
    			: "lightcellbig") + " svelte-1c2ysk8"))) {
    				attr_dev(button, "class", button_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(352:36) {:else}",
    		ctx
    	});

    	return block;
    }

    // (350:36) {#if gameboard.status.isLost}
    function create_if_block_8(ctx) {
    	let button;
    	let t;
    	let button_class_value;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text("🚩");

    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(/*gameboard*/ ctx[1].difficulty == 'hard'
    			? "redcellsmall"
    			: "redcellbig") + " svelte-1c2ysk8"));

    			add_location(button, file$5, 350, 40, 11273);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*gameboard*/ 2 && button_class_value !== (button_class_value = "" + (null_to_empty(/*gameboard*/ ctx[1].difficulty == 'hard'
    			? "redcellsmall"
    			: "redcellbig") + " svelte-1c2ysk8"))) {
    				attr_dev(button, "class", button_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(350:36) {#if gameboard.status.isLost}",
    		ctx
    	});

    	return block;
    }

    // (338:36) {:else}
    function create_else_block(ctx) {
    	let button;
    	let button_class_value;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[24](/*rowIndex*/ ctx[45], /*colIndex*/ ctx[48]);
    	}

    	function contextmenu_handler_1(...args) {
    		return /*contextmenu_handler_1*/ ctx[25](/*rowIndex*/ ctx[45], /*colIndex*/ ctx[48], ...args);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");

    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(/*gameboard*/ ctx[1].difficulty == 'hard'
    			? "lightcellsmall"
    			: "lightcellbig") + " svelte-1c2ysk8"));

    			attr_dev(button, "aria-label", "emptycell");
    			add_location(button, file$5, 338, 36, 10516);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", click_handler, false, false, false, false),
    					listen_dev(button, "contextmenu", contextmenu_handler_1, false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*gameboard*/ 2 && button_class_value !== (button_class_value = "" + (null_to_empty(/*gameboard*/ ctx[1].difficulty == 'hard'
    			? "lightcellsmall"
    			: "lightcellbig") + " svelte-1c2ysk8"))) {
    				attr_dev(button, "class", button_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(338:36) {:else}",
    		ctx
    	});

    	return block;
    }

    // (336:36) {#if gameboard.status.isLost}
    function create_if_block_6(ctx) {
    	let button;
    	let t;
    	let button_class_value;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text("💣");

    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(/*gameboard*/ ctx[1].difficulty == 'hard'
    			? "lightcellsmall"
    			: "lightcellbig") + " svelte-1c2ysk8"));

    			add_location(button, file$5, 336, 40, 10341);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*gameboard*/ 2 && button_class_value !== (button_class_value = "" + (null_to_empty(/*gameboard*/ ctx[1].difficulty == 'hard'
    			? "lightcellsmall"
    			: "lightcellbig") + " svelte-1c2ysk8"))) {
    				attr_dev(button, "class", button_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(336:36) {#if gameboard.status.isLost}",
    		ctx
    	});

    	return block;
    }

    // (333:58) 
    function create_if_block_5(ctx) {
    	let button;
    	let t;
    	let button_class_value;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text("💣");

    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(/*gameboard*/ ctx[1].difficulty == 'hard'
    			? "redcellsmall"
    			: "redcellbig") + " svelte-1c2ysk8"));

    			add_location(button, file$5, 333, 36, 10104);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*gameboard*/ 2 && button_class_value !== (button_class_value = "" + (null_to_empty(/*gameboard*/ ctx[1].difficulty == 'hard'
    			? "redcellsmall"
    			: "redcellbig") + " svelte-1c2ysk8"))) {
    				attr_dev(button, "class", button_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(333:58) ",
    		ctx
    	});

    	return block;
    }

    // (328:32) {#if cell.isFlagged}
    function create_if_block_4(ctx) {
    	let button;
    	let t;
    	let button_class_value;
    	let mounted;
    	let dispose;

    	function contextmenu_handler(...args) {
    		return /*contextmenu_handler*/ ctx[23](/*rowIndex*/ ctx[45], /*colIndex*/ ctx[48], ...args);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text("🚩");

    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(/*gameboard*/ ctx[1].difficulty == 'hard'
    			? "lightcellsmall"
    			: "lightcellbig") + " svelte-1c2ysk8"));

    			add_location(button, file$5, 328, 36, 9725);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "contextmenu", contextmenu_handler, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*gameboard*/ 2 && button_class_value !== (button_class_value = "" + (null_to_empty(/*gameboard*/ ctx[1].difficulty == 'hard'
    			? "lightcellsmall"
    			: "lightcellbig") + " svelte-1c2ysk8"))) {
    				attr_dev(button, "class", button_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(328:32) {#if cell.isFlagged}",
    		ctx
    	});

    	return block;
    }

    // (325:24) {#each row as cell, colIndex}
    function create_each_block_1(ctx) {
    	let if_block_anchor;

    	function select_block_type_1(ctx, dirty) {
    		if (/*cell*/ ctx[46].value == -1) return create_if_block_3$1;
    		if (/*cell*/ ctx[46].isFlagged) return create_if_block_7;
    		if (/*cell*/ ctx[46].isRevealed) return create_if_block_9;
    		return create_else_block_3;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(325:24) {#each row as cell, colIndex}",
    		ctx
    	});

    	return block;
    }

    // (323:20) {#each gameboard.board as row, rowIndex}
    function create_each_block$1(ctx) {
    	let div;
    	let t;
    	let each_value_1 = /*row*/ ctx[43];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			attr_dev(div, "class", "row svelte-1c2ysk8");
    			add_location(div, file$5, 323, 20, 9471);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}

    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*gameboard, handleRightClick, handleLeftClick*/ 12290) {
    				each_value_1 = /*row*/ ctx[43];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(323:20) {#each gameboard.board as row, rowIndex}",
    		ctx
    	});

    	return block;
    }

    // (382:31) 
    function create_if_block_1$2(ctx) {
    	let div;
    	let t0;
    	let br0;
    	let t1;
    	let br1;
    	let t2;
    	let br2;
    	let t3;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text("L");
    			br0 = element("br");
    			t1 = text("O");
    			br1 = element("br");
    			t2 = text("S");
    			br2 = element("br");
    			t3 = text("T");
    			add_location(br0, file$5, 382, 40, 13257);
    			add_location(br1, file$5, 382, 45, 13262);
    			add_location(br2, file$5, 382, 50, 13267);
    			attr_dev(div, "class", "sidelabel svelte-1c2ysk8");
    			add_location(div, file$5, 382, 16, 13233);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, br0);
    			append_dev(div, t1);
    			append_dev(div, br1);
    			append_dev(div, t2);
    			append_dev(div, br2);
    			append_dev(div, t3);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(382:31) ",
    		ctx
    	});

    	return block;
    }

    // (380:12) {#if gameWon}
    function create_if_block$2(ctx) {
    	let div;
    	let t0;
    	let br0;
    	let t1;
    	let br1;
    	let t2;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text("W");
    			br0 = element("br");
    			t1 = text("O");
    			br1 = element("br");
    			t2 = text("N");
    			add_location(br0, file$5, 380, 40, 13152);
    			add_location(br1, file$5, 380, 45, 13157);
    			attr_dev(div, "class", "sidelabel svelte-1c2ysk8");
    			add_location(div, file$5, 380, 16, 13128);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, br0);
    			append_dev(div, t1);
    			append_dev(div, br1);
    			append_dev(div, t2);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(380:12) {#if gameWon}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let t0;
    	let main;
    	let div5;
    	let div0;
    	let a;
    	let button0;
    	let t2;
    	let h1;
    	let t4;
    	let button1;
    	let t6;
    	let div2;
    	let t7;
    	let div1;
    	let t8;
    	let t9;
    	let div3;
    	let button2;
    	let img0;
    	let img0_src_value;
    	let t10;
    	let button3;
    	let img1;
    	let img1_src_value;
    	let t11;
    	let div4;
    	let button4;
    	let t12;
    	let t13_value = Math.floor(/*seconds*/ ctx[4] / 60) + "";
    	let t13;
    	let t14;

    	let t15_value = (/*seconds*/ ctx[4] % 60 < 10
    	? "0" + /*seconds*/ ctx[4] % 60
    	: /*seconds*/ ctx[4] % 60) + "";

    	let t15;
    	let t16;
    	let button5;
    	let t17;
    	let t18;
    	let t19;
    	let t20;
    	let t21;
    	let select;
    	let option0;
    	let t22;
    	let option1;
    	let t23;
    	let option2;
    	let t24;
    	let t25;
    	let button6;
    	let mounted;
    	let dispose;
    	let if_block0 = /*showChat*/ ctx[10] && create_if_block_12(ctx);
    	let if_block1 = (/*gameWon*/ ctx[8] || /*gameLost*/ ctx[9]) && create_if_block_11(ctx);

    	function select_block_type(ctx, dirty) {
    		if (/*gameboard*/ ctx[1]) return create_if_block_2$2;
    		return create_else_block_4;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block2 = current_block_type(ctx);

    	function select_block_type_5(ctx, dirty) {
    		if (/*gameWon*/ ctx[8]) return create_if_block$2;
    		if (/*gameLost*/ ctx[9]) return create_if_block_1$2;
    	}

    	let current_block_type_1 = select_block_type_5(ctx);
    	let if_block3 = current_block_type_1 && current_block_type_1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t0 = space();
    			main = element("main");
    			div5 = element("div");
    			div0 = element("div");
    			a = element("a");
    			button0 = element("button");
    			button0.textContent = "Menu";
    			t2 = space();
    			h1 = element("h1");
    			h1.textContent = "MINESWEEPER";
    			t4 = space();
    			button1 = element("button");
    			button1.textContent = "Reset";
    			t6 = space();
    			div2 = element("div");
    			if (if_block1) if_block1.c();
    			t7 = space();
    			div1 = element("div");
    			if_block2.c();
    			t8 = space();
    			if (if_block3) if_block3.c();
    			t9 = space();
    			div3 = element("div");
    			button2 = element("button");
    			img0 = element("img");
    			t10 = space();
    			button3 = element("button");
    			img1 = element("img");
    			t11 = space();
    			div4 = element("div");
    			button4 = element("button");
    			t12 = text("Time: ");
    			t13 = text(t13_value);
    			t14 = text(":");
    			t15 = text(t15_value);
    			t16 = space();
    			button5 = element("button");
    			t17 = text("Mines left: ");
    			t18 = text(/*numofflags*/ ctx[3]);
    			t19 = text("/");
    			t20 = text(/*mines*/ ctx[2]);
    			t21 = space();
    			select = element("select");
    			option0 = element("option");
    			t22 = text("Easy");
    			option1 = element("option");
    			t23 = text("Medium");
    			option2 = element("option");
    			t24 = text("Hard");
    			t25 = space();
    			button6 = element("button");
    			button6.textContent = "Open Chat";
    			attr_dev(button0, "class", "Menu-button svelte-1c2ysk8");
    			add_location(button0, file$5, 311, 25, 8925);
    			attr_dev(a, "href", "#/");
    			add_location(a, file$5, 311, 12, 8912);
    			attr_dev(h1, "class", "headline svelte-1c2ysk8");
    			add_location(h1, file$5, 312, 12, 8983);
    			attr_dev(button1, "class", "Reset-button svelte-1c2ysk8");
    			add_location(button1, file$5, 313, 12, 9033);
    			attr_dev(div0, "class", "header");
    			add_location(div0, file$5, 310, 8, 8879);
    			attr_dev(div1, "class", "grid svelte-1c2ysk8");
    			add_location(div1, file$5, 320, 12, 9339);
    			attr_dev(div2, "class", "board svelte-1c2ysk8");
    			add_location(div2, file$5, 316, 8, 9178);
    			attr_dev(img0, "class", "eye svelte-1c2ysk8");
    			if (!src_url_equal(img0.src, img0_src_value = "img/eye.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "eye icon");
    			add_location(img0, file$5, 387, 62, 13403);
    			attr_dev(button2, "class", "hint-btn svelte-1c2ysk8");
    			add_location(button2, file$5, 387, 12, 13353);
    			attr_dev(img1, "class", "hintflag svelte-1c2ysk8");
    			if (!src_url_equal(img1.src, img1_src_value = "img/hintflag.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "hint flag");
    			add_location(img1, file$5, 388, 63, 13526);
    			attr_dev(button3, "class", "hint-btn svelte-1c2ysk8");
    			add_location(button3, file$5, 388, 12, 13475);
    			attr_dev(div3, "class", "hints svelte-1c2ysk8");
    			add_location(div3, file$5, 386, 8, 13321);
    			attr_dev(button4, "class", "Time svelte-1c2ysk8");
    			add_location(button4, file$5, 392, 12, 13654);
    			attr_dev(button5, "class", "MinesLeft svelte-1c2ysk8");
    			add_location(button5, file$5, 393, 12, 13780);
    			option0.__value = "easy";
    			option0.value = option0.__value;
    			option0.selected = /*Easyoption*/ ctx[5];
    			attr_dev(option0, "class", "svelte-1c2ysk8");
    			add_location(option0, file$5, 395, 16, 13885);
    			option1.__value = "medium";
    			option1.value = option1.__value;
    			option1.selected = /*Mediumoption*/ ctx[6];
    			attr_dev(option1, "class", "svelte-1c2ysk8");
    			add_location(option1, file$5, 396, 16, 14000);
    			option2.__value = "hard";
    			option2.value = option2.__value;
    			option2.selected = /*Hardoption*/ ctx[7];
    			attr_dev(option2, "class", "svelte-1c2ysk8");
    			add_location(option2, file$5, 397, 16, 14123);
    			attr_dev(select, "class", "svelte-1c2ysk8");
    			add_location(select, file$5, 394, 12, 13860);
    			attr_dev(div4, "class", "footer svelte-1c2ysk8");
    			add_location(div4, file$5, 391, 8, 13621);
    			attr_dev(div5, "class", "container svelte-1c2ysk8");
    			add_location(div5, file$5, 309, 4, 8847);
    			attr_dev(button6, "class", "chat-btn svelte-1c2ysk8");
    			add_location(button6, file$5, 401, 4, 14274);
    			attr_dev(main, "class", "svelte-1c2ysk8");
    			add_location(main, file$5, 308, 0, 8836);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, div5);
    			append_dev(div5, div0);
    			append_dev(div0, a);
    			append_dev(a, button0);
    			append_dev(div0, t2);
    			append_dev(div0, h1);
    			append_dev(div0, t4);
    			append_dev(div0, button1);
    			append_dev(div5, t6);
    			append_dev(div5, div2);
    			if (if_block1) if_block1.m(div2, null);
    			append_dev(div2, t7);
    			append_dev(div2, div1);
    			if_block2.m(div1, null);
    			append_dev(div2, t8);
    			if (if_block3) if_block3.m(div2, null);
    			append_dev(div5, t9);
    			append_dev(div5, div3);
    			append_dev(div3, button2);
    			append_dev(button2, img0);
    			append_dev(div3, t10);
    			append_dev(div3, button3);
    			append_dev(button3, img1);
    			append_dev(div5, t11);
    			append_dev(div5, div4);
    			append_dev(div4, button4);
    			append_dev(button4, t12);
    			append_dev(button4, t13);
    			append_dev(button4, t14);
    			append_dev(button4, t15);
    			append_dev(div4, t16);
    			append_dev(div4, button5);
    			append_dev(button5, t17);
    			append_dev(button5, t18);
    			append_dev(button5, t19);
    			append_dev(button5, t20);
    			append_dev(div4, t21);
    			append_dev(div4, select);
    			append_dev(select, option0);
    			append_dev(option0, t22);
    			append_dev(select, option1);
    			append_dev(option1, t23);
    			append_dev(select, option2);
    			append_dev(option2, t24);
    			append_dev(main, t25);
    			append_dev(main, button6);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button1, "click", /*resetboard*/ ctx[14], false, false, false, false),
    					listen_dev(button2, "click", /*handleHintEye*/ ctx[16], false, false, false, false),
    					listen_dev(button3, "click", /*handleHintFlag*/ ctx[17], false, false, false, false),
    					listen_dev(option0, "click", /*click_handler_2*/ ctx[29], false, false, false, false),
    					listen_dev(option1, "click", /*click_handler_3*/ ctx[30], false, false, false, false),
    					listen_dev(option2, "click", /*click_handler_4*/ ctx[31], false, false, false, false),
    					listen_dev(button6, "click", /*toggleChat*/ ctx[19], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*showChat*/ ctx[10]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_12(ctx);
    					if_block0.c();
    					if_block0.m(t0.parentNode, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*gameWon*/ ctx[8] || /*gameLost*/ ctx[9]) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block_11(ctx);
    					if_block1.c();
    					if_block1.m(div2, t7);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block2) {
    				if_block2.p(ctx, dirty);
    			} else {
    				if_block2.d(1);
    				if_block2 = current_block_type(ctx);

    				if (if_block2) {
    					if_block2.c();
    					if_block2.m(div1, null);
    				}
    			}

    			if (current_block_type_1 !== (current_block_type_1 = select_block_type_5(ctx))) {
    				if (if_block3) if_block3.d(1);
    				if_block3 = current_block_type_1 && current_block_type_1(ctx);

    				if (if_block3) {
    					if_block3.c();
    					if_block3.m(div2, null);
    				}
    			}

    			if (dirty[0] & /*seconds*/ 16 && t13_value !== (t13_value = Math.floor(/*seconds*/ ctx[4] / 60) + "")) set_data_dev(t13, t13_value);

    			if (dirty[0] & /*seconds*/ 16 && t15_value !== (t15_value = (/*seconds*/ ctx[4] % 60 < 10
    			? "0" + /*seconds*/ ctx[4] % 60
    			: /*seconds*/ ctx[4] % 60) + "")) set_data_dev(t15, t15_value);

    			if (dirty[0] & /*numofflags*/ 8) set_data_dev(t18, /*numofflags*/ ctx[3]);
    			if (dirty[0] & /*mines*/ 4) set_data_dev(t20, /*mines*/ ctx[2]);

    			if (dirty[0] & /*Easyoption*/ 32) {
    				prop_dev(option0, "selected", /*Easyoption*/ ctx[5]);
    			}

    			if (dirty[0] & /*Mediumoption*/ 64) {
    				prop_dev(option1, "selected", /*Mediumoption*/ ctx[6]);
    			}

    			if (dirty[0] & /*Hardoption*/ 128) {
    				prop_dev(option2, "selected", /*Hardoption*/ ctx[7]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			if (if_block1) if_block1.d();
    			if_block2.d();

    			if (if_block3) {
    				if_block3.d();
    			}

    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Game', slots, []);
    	let data;
    	let chat;
    	let gameboard;
    	let nickname;
    	let mines = 0;
    	let numofflags = mines;
    	let interval;
    	let seconds = 0;
    	let Easyoption = false;
    	let Mediumoption = false;
    	let Hardoption = false;
    	let gameWon = false;
    	let gameLost = false;
    	let showChat = false;
    	let message;
    	let chatInterval = 1000;

    	let getdata = async () => {
    		try {
    			$$invalidate(0, chat = await getChat());
    			nickname = await getUser();
    			data = await generateBoard();
    			$$invalidate(1, gameboard = data.board);

    			if (data.lastTime) {
    				$$invalidate(4, seconds = data.lastTime);
    			}

    			$$invalidate(2, mines = gameboard.details.mines);

    			// set correct number of mines
    			$$invalidate(3, numofflags = mines - getmines(gameboard));

    			// get difficulty
    			if (gameboard.difficulty == "easy") {
    				$$invalidate(5, Easyoption = true);
    				$$invalidate(6, Mediumoption = false);
    				$$invalidate(7, Hardoption = false);
    			} else if (gameboard.difficulty == "medium") {
    				$$invalidate(5, Easyoption = false);
    				$$invalidate(6, Mediumoption = true);
    				$$invalidate(7, Hardoption = false);
    			} else {
    				$$invalidate(5, Easyoption = false);
    				$$invalidate(6, Mediumoption = false);
    				$$invalidate(7, Hardoption = true);
    			}

    			// manage start of time
    			if (gameboard.status.isLost || gameboard.status.isWon) {
    				handleTime(false);
    			} else if (gameboard.status.isStarted) {
    				handleTime(true);
    			}

    			// manage you won/lost text
    			if (gameboard.status.isWon) {
    				$$invalidate(8, gameWon = true);
    			} else if (gameboard.status.isLost) {
    				$$invalidate(9, gameLost = true);
    			}
    		} catch(error) {
    			console.error("Error fetching data:", error);
    		}
    	};

    	onMount(() => {
    		if (showChat) {
    			scrollToBottom();
    		}

    		document.body.classList.add('dark-bg');
    		getdata();

    		return () => {
    			console.log("saving time");
    			saveTime(seconds);
    		};
    	});

    	let getmines = board => {
    		const rows = board.details.rows;
    		const cols = board.details.cols;
    		let count = 0;

    		for (let i = 0; i < rows; i++) {
    			for (let j = 0; j < cols; j++) {
    				if (board.board[i][j].isFlagged) {
    					count++;
    				}
    			}
    		}

    		return count;
    	};

    	let handleTime = started => {
    		if (started) {
    			interval = setInterval(
    				() => {
    					$$invalidate(4, seconds++, seconds);
    				},
    				1000
    			);
    		} else {
    			$$invalidate(4, seconds = 0);
    			clearInterval(interval);
    		}
    	};

    	let handleLeftClick = async (row, col) => {
    		if (!gameboard.status.isStarted) {
    			handleTime(true);
    		}

    		try {
    			$$invalidate(1, gameboard = await revealCell(row, col, gameboard));

    			if (gameboard.status.isWon) {
    				sendTime(seconds, gameboard.difficulty);
    			}
    		} catch {
    			
    		}

    		if (gameboard.status.isLost || gameboard.status.isWon) {
    			if (gameboard.status.isLost) {
    				$$invalidate(9, gameLost = true);
    			} else if (gameboard.status.isWon) {
    				$$invalidate(8, gameWon = true);
    			} else {
    				$$invalidate(9, gameLost = false);
    				$$invalidate(8, gameWon = false);
    			}

    			clearInterval(interval);
    		}
    	};

    	let handleRightClick = async (event, row, col) => {
    		if (event) {
    			event.preventDefault();
    		}

    		try {
    			$$invalidate(1, gameboard = await flagCell(row, col, gameboard));

    			if (gameboard.board[row][col].isFlagged) {
    				decrement(gameboard.status);
    			} else {
    				increment(gameboard.status);
    			}
    		} catch {
    			
    		}
    	};

    	let resetboard = async () => {
    		try {
    			$$invalidate(1, gameboard = await changeDifficulty(gameboard.difficulty));
    			$$invalidate(2, mines = gameboard.details.mines);
    			$$invalidate(3, numofflags = mines);
    			handleTime(false);
    		} catch {
    			
    		}

    		$$invalidate(9, gameLost = false);
    		$$invalidate(8, gameWon = false);
    	};

    	let difficultyChange = async option => {
    		try {
    			$$invalidate(1, gameboard = await changeDifficulty(option));
    			$$invalidate(2, mines = gameboard.details.mines);
    			$$invalidate(3, numofflags = mines);
    			handleTime(false);
    		} catch {
    			
    		}

    		$$invalidate(9, gameLost = false);
    		$$invalidate(8, gameWon = false);
    	};

    	let increment = state => {
    		if (!state.isWon && !state.isLost) {
    			$$invalidate(3, numofflags += 1);
    		}
    	};

    	let decrement = state => {
    		if (!state.isWon && !state.isLost) {
    			$$invalidate(3, numofflags -= 1);
    		}
    	};

    	let handleHintEye = async () => {
    		for (let r = 0; r < gameboard.details.rows; r++) {
    			for (let c = 0; c < gameboard.details.cols; c++) {
    				if (!gameboard.board[r][c].isRevealed && gameboard.board[r][c].value >= 0) {
    					await handleLeftClick(r, c);
    					$$invalidate(4, seconds += 15);
    					return;
    				}
    			}
    		}
    	};

    	let handleHintFlag = async () => {
    		for (let r = 0; r < gameboard.details.rows; r++) {
    			for (let c = 0; c < gameboard.details.cols; c++) {
    				if (gameboard.board[r][c].value == -1 && !gameboard.board[r][c].isFlagged) {
    					try {
    						await handleRightClick(null, r, c);
    						$$invalidate(4, seconds += 15);
    						return;
    					} catch(error) {
    						console.log(error);
    					}
    				}
    			}
    		}
    	};

    	let handleEscape = event => {
    		if (event.key == "Escape") {
    			toggleChat();
    		}
    	};

    	let toggleChat = async () => {
    		$$invalidate(10, showChat = !showChat);
    		await updateChat();
    		scrollToBottom();
    	};

    	let updateChat = async () => {
    		if (showChat) {
    			chatInterval = setInterval(
    				async () => {
    					$$invalidate(0, chat = await getChat());
    				},
    				1000
    			);
    		} else {
    			clearInterval(chatInterval);
    		}
    	};

    	let handleSubmit = async () => {
    		if (message == "") {
    			return;
    		}

    		await sendMessage(message);
    		$$invalidate(0, chat = await getChat());
    		$$invalidate(11, message = "");
    		await tick();
    		scrollToBottom();
    	};

    	let handleEnter = event => {
    		if (event.key === "Enter") {
    			handleSubmit(message);
    		}
    	};

    	let scrollToBottom = () => {
    		const chatbox = document.querySelector('.chatbox');

    		if (chatbox) {
    			chatbox.scrollTop = chatbox.scrollHeight;
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<Game> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		message = this.value;
    		$$invalidate(11, message);
    	}

    	const contextmenu_handler = (rowIndex, colIndex, event) => handleRightClick(event, rowIndex, colIndex);
    	const click_handler = (rowIndex, colIndex) => handleLeftClick(rowIndex, colIndex);
    	const contextmenu_handler_1 = (rowIndex, colIndex, event) => handleRightClick(event, rowIndex, colIndex);
    	const contextmenu_handler_2 = (rowIndex, colIndex, event) => handleRightClick(event, rowIndex, colIndex);
    	const click_handler_1 = (rowIndex, colIndex) => handleLeftClick(rowIndex, colIndex);
    	const contextmenu_handler_3 = (rowIndex, colIndex, event) => handleRightClick(event, rowIndex, colIndex);
    	const click_handler_2 = () => difficultyChange("easy");
    	const click_handler_3 = () => difficultyChange("medium");
    	const click_handler_4 = () => difficultyChange("hard");

    	$$self.$capture_state = () => ({
    		onMount,
    		tick,
    		getUser,
    		generateBoard,
    		flagCell,
    		revealCell,
    		changeDifficulty,
    		sendTime,
    		saveTime,
    		getChat,
    		sendMessage,
    		each,
    		data,
    		chat,
    		gameboard,
    		nickname,
    		mines,
    		numofflags,
    		interval,
    		seconds,
    		Easyoption,
    		Mediumoption,
    		Hardoption,
    		gameWon,
    		gameLost,
    		showChat,
    		message,
    		chatInterval,
    		getdata,
    		getmines,
    		handleTime,
    		handleLeftClick,
    		handleRightClick,
    		resetboard,
    		difficultyChange,
    		increment,
    		decrement,
    		handleHintEye,
    		handleHintFlag,
    		handleEscape,
    		toggleChat,
    		updateChat,
    		handleSubmit,
    		handleEnter,
    		scrollToBottom
    	});

    	$$self.$inject_state = $$props => {
    		if ('data' in $$props) data = $$props.data;
    		if ('chat' in $$props) $$invalidate(0, chat = $$props.chat);
    		if ('gameboard' in $$props) $$invalidate(1, gameboard = $$props.gameboard);
    		if ('nickname' in $$props) nickname = $$props.nickname;
    		if ('mines' in $$props) $$invalidate(2, mines = $$props.mines);
    		if ('numofflags' in $$props) $$invalidate(3, numofflags = $$props.numofflags);
    		if ('interval' in $$props) interval = $$props.interval;
    		if ('seconds' in $$props) $$invalidate(4, seconds = $$props.seconds);
    		if ('Easyoption' in $$props) $$invalidate(5, Easyoption = $$props.Easyoption);
    		if ('Mediumoption' in $$props) $$invalidate(6, Mediumoption = $$props.Mediumoption);
    		if ('Hardoption' in $$props) $$invalidate(7, Hardoption = $$props.Hardoption);
    		if ('gameWon' in $$props) $$invalidate(8, gameWon = $$props.gameWon);
    		if ('gameLost' in $$props) $$invalidate(9, gameLost = $$props.gameLost);
    		if ('showChat' in $$props) $$invalidate(10, showChat = $$props.showChat);
    		if ('message' in $$props) $$invalidate(11, message = $$props.message);
    		if ('chatInterval' in $$props) chatInterval = $$props.chatInterval;
    		if ('getdata' in $$props) getdata = $$props.getdata;
    		if ('getmines' in $$props) getmines = $$props.getmines;
    		if ('handleTime' in $$props) handleTime = $$props.handleTime;
    		if ('handleLeftClick' in $$props) $$invalidate(12, handleLeftClick = $$props.handleLeftClick);
    		if ('handleRightClick' in $$props) $$invalidate(13, handleRightClick = $$props.handleRightClick);
    		if ('resetboard' in $$props) $$invalidate(14, resetboard = $$props.resetboard);
    		if ('difficultyChange' in $$props) $$invalidate(15, difficultyChange = $$props.difficultyChange);
    		if ('increment' in $$props) increment = $$props.increment;
    		if ('decrement' in $$props) decrement = $$props.decrement;
    		if ('handleHintEye' in $$props) $$invalidate(16, handleHintEye = $$props.handleHintEye);
    		if ('handleHintFlag' in $$props) $$invalidate(17, handleHintFlag = $$props.handleHintFlag);
    		if ('handleEscape' in $$props) $$invalidate(18, handleEscape = $$props.handleEscape);
    		if ('toggleChat' in $$props) $$invalidate(19, toggleChat = $$props.toggleChat);
    		if ('updateChat' in $$props) updateChat = $$props.updateChat;
    		if ('handleSubmit' in $$props) $$invalidate(20, handleSubmit = $$props.handleSubmit);
    		if ('handleEnter' in $$props) $$invalidate(21, handleEnter = $$props.handleEnter);
    		if ('scrollToBottom' in $$props) scrollToBottom = $$props.scrollToBottom;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		chat,
    		gameboard,
    		mines,
    		numofflags,
    		seconds,
    		Easyoption,
    		Mediumoption,
    		Hardoption,
    		gameWon,
    		gameLost,
    		showChat,
    		message,
    		handleLeftClick,
    		handleRightClick,
    		resetboard,
    		difficultyChange,
    		handleHintEye,
    		handleHintFlag,
    		handleEscape,
    		toggleChat,
    		handleSubmit,
    		handleEnter,
    		input_input_handler,
    		contextmenu_handler,
    		click_handler,
    		contextmenu_handler_1,
    		contextmenu_handler_2,
    		click_handler_1,
    		contextmenu_handler_3,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4
    	];
    }

    class Game extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {}, null, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Game",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/routes/tutorial.svelte generated by Svelte v3.59.2 */
    const file$4 = "src/routes/tutorial.svelte";

    function create_fragment$4(ctx) {
    	let main;
    	let div0;
    	let a;
    	let button0;
    	let t1;
    	let h1;
    	let t3;
    	let div1;
    	let button1;
    	let img0;
    	let img0_src_value;
    	let button1_class_value;
    	let t4;
    	let img1;
    	let img1_src_value;
    	let t5;
    	let button2;
    	let img2;
    	let img2_src_value;
    	let button2_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div0 = element("div");
    			a = element("a");
    			button0 = element("button");
    			button0.textContent = "End";
    			t1 = space();
    			h1 = element("h1");
    			h1.textContent = "MINESWEEPER TUTORIAL";
    			t3 = space();
    			div1 = element("div");
    			button1 = element("button");
    			img0 = element("img");
    			t4 = space();
    			img1 = element("img");
    			t5 = space();
    			button2 = element("button");
    			img2 = element("img");
    			attr_dev(button0, "class", "end-button svelte-1m5wla");
    			add_location(button0, file$4, 50, 17, 1123);
    			attr_dev(a, "href", "#/");
    			add_location(a, file$4, 50, 4, 1110);
    			attr_dev(h1, "class", "headline svelte-1m5wla");
    			add_location(h1, file$4, 51, 4, 1171);
    			attr_dev(div0, "class", "header svelte-1m5wla");
    			add_location(div0, file$4, 49, 2, 1085);
    			attr_dev(img0, "class", "arrow svelte-1m5wla");
    			if (!src_url_equal(img0.src, img0_src_value = "/img/arrow_left.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "left arrow");
    			add_location(img0, file$4, 54, 87, 1350);
    			attr_dev(button1, "class", button1_class_value = "" + (null_to_empty(/*currentIndex*/ ctx[0] == 0 ? "arrow-dis" : "arrow-btn") + " svelte-1m5wla"));
    			add_location(button1, file$4, 54, 4, 1267);
    			if (!src_url_equal(img1.src, img1_src_value = /*images*/ ctx[1][/*currentIndex*/ ctx[0]])) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "Slideshow");
    			attr_dev(img1, "class", "slideshow-image svelte-1m5wla");
    			add_location(img1, file$4, 55, 4, 1426);
    			attr_dev(img2, "class", "arrow svelte-1m5wla");
    			if (!src_url_equal(img2.src, img2_src_value = "/img/arrow_right.png")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "right arrow");
    			add_location(img2, file$4, 56, 101, 1600);

    			attr_dev(button2, "class", button2_class_value = "" + (null_to_empty(/*currentIndex*/ ctx[0] == /*images*/ ctx[1].length - 1
    			? "arrow-dis"
    			: "arrow-btn") + " svelte-1m5wla"));

    			add_location(button2, file$4, 56, 4, 1503);
    			attr_dev(div1, "class", "slideshow-container svelte-1m5wla");
    			add_location(div1, file$4, 53, 2, 1229);
    			attr_dev(main, "class", "tutorialmain svelte-1m5wla");
    			add_location(main, file$4, 48, 0, 1055);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div0);
    			append_dev(div0, a);
    			append_dev(a, button0);
    			append_dev(div0, t1);
    			append_dev(div0, h1);
    			append_dev(main, t3);
    			append_dev(main, div1);
    			append_dev(div1, button1);
    			append_dev(button1, img0);
    			append_dev(div1, t4);
    			append_dev(div1, img1);
    			append_dev(div1, t5);
    			append_dev(div1, button2);
    			append_dev(button2, img2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button1, "click", /*prevImage*/ ctx[3], false, false, false, false),
    					listen_dev(button2, "click", /*nextImage*/ ctx[2], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*currentIndex*/ 1 && button1_class_value !== (button1_class_value = "" + (null_to_empty(/*currentIndex*/ ctx[0] == 0 ? "arrow-dis" : "arrow-btn") + " svelte-1m5wla"))) {
    				attr_dev(button1, "class", button1_class_value);
    			}

    			if (dirty & /*currentIndex*/ 1 && !src_url_equal(img1.src, img1_src_value = /*images*/ ctx[1][/*currentIndex*/ ctx[0]])) {
    				attr_dev(img1, "src", img1_src_value);
    			}

    			if (dirty & /*currentIndex*/ 1 && button2_class_value !== (button2_class_value = "" + (null_to_empty(/*currentIndex*/ ctx[0] == /*images*/ ctx[1].length - 1
    			? "arrow-dis"
    			: "arrow-btn") + " svelte-1m5wla"))) {
    				attr_dev(button2, "class", button2_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Tutorial', slots, []);

    	onMount(() => {
    		document.body.classList.add('light-bg'); // Add blue background class

    		return () => {
    			document.body.classList.remove('light-bg'); // Remove it when leaving the page
    		};
    	});

    	let currentIndex = 0;

    	// Array of image URLs or paths
    	const images = [
    		"/img/tutorial-1.png",
    		"/img/tutorial-2.png",
    		"/img/tutorial-3.png",
    		"/img/tutorial-4.png",
    		"/img/tutorial-5.png",
    		"/img/tutorial-6.png",
    		"/img/tutorial-7.png"
    	];

    	// Next image handler
    	function nextImage() {
    		if (currentIndex != images.length - 1) {
    			$$invalidate(0, currentIndex = (currentIndex + 1) % images.length);
    		}
    	}

    	// Previous image handler
    	function prevImage() {
    		if (currentIndex != 0) {
    			$$invalidate(0, currentIndex = (currentIndex - 1 + images.length) % images.length);
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Tutorial> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		currentIndex,
    		images,
    		nextImage,
    		prevImage
    	});

    	$$self.$inject_state = $$props => {
    		if ('currentIndex' in $$props) $$invalidate(0, currentIndex = $$props.currentIndex);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [currentIndex, images, nextImage, prevImage];
    }

    class Tutorial extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tutorial",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    const getTopTen = async (changeDifficulty) => {
        const response = await fetch(`http://localhost:5000/api/leaderboard?difficulty=${changeDifficulty}`, {
          method: "GET",
          credentials: "include",
        });
      
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch the leaderboard.");
        }
      
        const topten = await response.json();
        return [topten.leaderboard, topten.user];
      };

    const deleteTime = async (difficulty) => {
      //
      const response = await fetch("http://localhost:5000/api/leaderboard", {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          difficulty: difficulty,
        }),
      });

      //
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete the board.");
      }
    };

    /* src/routes/leaderboard.svelte generated by Svelte v3.59.2 */

    const { Object: Object_1, console: console_1 } = globals;
    const file$3 = "src/routes/leaderboard.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	child_ctx[10] = i;
    	return child_ctx;
    }

    // (61:8) {#if topTen[0].length == 0}
    function create_if_block_2$1(ctx) {
    	let hr;
    	let t0;
    	let div;

    	const block = {
    		c: function create() {
    			hr = element("hr");
    			t0 = space();
    			div = element("div");
    			div.textContent = "No data available";
    			attr_dev(hr, "class", "svelte-1aq968v");
    			add_location(hr, file$3, 61, 12, 2261);
    			attr_dev(div, "class", "nodata svelte-1aq968v");
    			add_location(div, file$3, 62, 12, 2278);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, hr, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(hr);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(61:8) {#if topTen[0].length == 0}",
    		ctx
    	});

    	return block;
    }

    // (71:16) {#if data.nickname == username}
    function create_if_block_1$1(ctx) {
    	let button;
    	let img;
    	let img_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			img = element("img");
    			attr_dev(img, "class", "trashcan svelte-1aq968v");
    			if (!src_url_equal(img.src, img_src_value = "img/trash-can.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "trash can");
    			add_location(img, file$3, 71, 85, 2883);
    			attr_dev(button, "class", "trashcan-btn svelte-1aq968v");
    			add_location(button, file$3, 71, 20, 2818);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, img);

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*handleMyTime*/ ctx[4](/*difficulty*/ ctx[1]))) /*handleMyTime*/ ctx[4](/*difficulty*/ ctx[1]).apply(this, arguments);
    					},
    					false,
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(71:16) {#if data.nickname == username}",
    		ctx
    	});

    	return block;
    }

    // (65:8) {#each topTen[0] as data, position}
    function create_each_block(ctx) {
    	let hr;
    	let t0;
    	let div3;
    	let div0;
    	let t1_value = /*position*/ ctx[10] + 1 + "";
    	let t1;
    	let t2;
    	let div1;
    	let t3_value = /*data*/ ctx[8].nickname + "";
    	let t3;
    	let t4;
    	let div2;
    	let t5_value = Math.floor(/*data*/ ctx[8].fastestTime / 60) + "";
    	let t5;
    	let t6;

    	let t7_value = (/*data*/ ctx[8].fastestTime % 60 < 10
    	? "0" + /*data*/ ctx[8].fastestTime % 60
    	: /*data*/ ctx[8].fastestTime % 60) + "";

    	let t7;
    	let t8;
    	let div3_class_value;
    	let if_block = /*data*/ ctx[8].nickname == /*username*/ ctx[0] && create_if_block_1$1(ctx);

    	const block = {
    		c: function create() {
    			hr = element("hr");
    			t0 = space();
    			div3 = element("div");
    			div0 = element("div");
    			t1 = text(t1_value);
    			t2 = space();
    			div1 = element("div");
    			t3 = text(t3_value);
    			t4 = space();
    			div2 = element("div");
    			t5 = text(t5_value);
    			t6 = text(":");
    			t7 = text(t7_value);
    			t8 = space();
    			if (if_block) if_block.c();
    			attr_dev(hr, "class", "svelte-1aq968v");
    			add_location(hr, file$3, 65, 12, 2392);
    			attr_dev(div0, "class", "position svelte-1aq968v");
    			add_location(div0, file$3, 67, 16, 2487);
    			attr_dev(div1, "class", "username svelte-1aq968v");
    			add_location(div1, file$3, 68, 16, 2544);
    			attr_dev(div2, "class", "bestTime svelte-1aq968v");
    			add_location(div2, file$3, 69, 16, 2604);

    			attr_dev(div3, "class", div3_class_value = "" + (null_to_empty(/*data*/ ctx[8].nickname == /*username*/ ctx[0]
    			? 'inTopTen'
    			: 'item') + " svelte-1aq968v"));

    			add_location(div3, file$3, 66, 12, 2409);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, hr, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div0, t1);
    			append_dev(div3, t2);
    			append_dev(div3, div1);
    			append_dev(div1, t3);
    			append_dev(div3, t4);
    			append_dev(div3, div2);
    			append_dev(div2, t5);
    			append_dev(div2, t6);
    			append_dev(div2, t7);
    			append_dev(div3, t8);
    			if (if_block) if_block.m(div3, null);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*topTen*/ 4 && t3_value !== (t3_value = /*data*/ ctx[8].nickname + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*topTen*/ 4 && t5_value !== (t5_value = Math.floor(/*data*/ ctx[8].fastestTime / 60) + "")) set_data_dev(t5, t5_value);

    			if (dirty & /*topTen*/ 4 && t7_value !== (t7_value = (/*data*/ ctx[8].fastestTime % 60 < 10
    			? "0" + /*data*/ ctx[8].fastestTime % 60
    			: /*data*/ ctx[8].fastestTime % 60) + "")) set_data_dev(t7, t7_value);

    			if (/*data*/ ctx[8].nickname == /*username*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$1(ctx);
    					if_block.c();
    					if_block.m(div3, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*topTen, username*/ 5 && div3_class_value !== (div3_class_value = "" + (null_to_empty(/*data*/ ctx[8].nickname == /*username*/ ctx[0]
    			? 'inTopTen'
    			: 'item') + " svelte-1aq968v"))) {
    				attr_dev(div3, "class", div3_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(hr);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div3);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(65:8) {#each topTen[0] as data, position}",
    		ctx
    	});

    	return block;
    }

    // (76:8) {#if topTen[1].position}
    function create_if_block$1(ctx) {
    	let hr;
    	let t0;
    	let div3;
    	let div0;
    	let t1_value = /*topTen*/ ctx[2][1].position + "";
    	let t1;
    	let t2;
    	let div1;
    	let t3;
    	let t4;
    	let div2;
    	let t5_value = Math.floor(/*topTen*/ ctx[2][1].fastestTime / 60) + "";
    	let t5;
    	let t6;

    	let t7_value = (/*topTen*/ ctx[2][1].fastestTime % 60 < 10
    	? "0" + /*topTen*/ ctx[2][1].fastestTime % 60
    	: /*topTen*/ ctx[2][1].fastestTime % 60) + "";

    	let t7;
    	let t8;
    	let button;
    	let img;
    	let img_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			hr = element("hr");
    			t0 = space();
    			div3 = element("div");
    			div0 = element("div");
    			t1 = text(t1_value);
    			t2 = space();
    			div1 = element("div");
    			t3 = text(/*username*/ ctx[0]);
    			t4 = space();
    			div2 = element("div");
    			t5 = text(t5_value);
    			t6 = text(":");
    			t7 = text(t7_value);
    			t8 = space();
    			button = element("button");
    			img = element("img");
    			attr_dev(hr, "class", "underTopTen svelte-1aq968v");
    			add_location(hr, file$3, 76, 12, 3057);
    			attr_dev(div0, "class", "position svelte-1aq968v");
    			add_location(div0, file$3, 78, 16, 3133);
    			attr_dev(div1, "class", "username svelte-1aq968v");
    			add_location(div1, file$3, 79, 16, 3198);
    			attr_dev(div2, "class", "bestTime svelte-1aq968v");
    			add_location(div2, file$3, 80, 16, 3253);
    			attr_dev(img, "class", "trashcan svelte-1aq968v");
    			if (!src_url_equal(img.src, img_src_value = "img/trash-can.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "trash can");
    			add_location(img, file$3, 81, 81, 3500);
    			attr_dev(button, "class", "trashcan-btn svelte-1aq968v");
    			add_location(button, file$3, 81, 16, 3435);
    			attr_dev(div3, "class", "inTopTen svelte-1aq968v");
    			add_location(div3, file$3, 77, 12, 3094);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, hr, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div0, t1);
    			append_dev(div3, t2);
    			append_dev(div3, div1);
    			append_dev(div1, t3);
    			append_dev(div3, t4);
    			append_dev(div3, div2);
    			append_dev(div2, t5);
    			append_dev(div2, t6);
    			append_dev(div2, t7);
    			append_dev(div3, t8);
    			append_dev(div3, button);
    			append_dev(button, img);

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*handleMyTime*/ ctx[4](/*difficulty*/ ctx[1]))) /*handleMyTime*/ ctx[4](/*difficulty*/ ctx[1]).apply(this, arguments);
    					},
    					false,
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*topTen*/ 4 && t1_value !== (t1_value = /*topTen*/ ctx[2][1].position + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*username*/ 1) set_data_dev(t3, /*username*/ ctx[0]);
    			if (dirty & /*topTen*/ 4 && t5_value !== (t5_value = Math.floor(/*topTen*/ ctx[2][1].fastestTime / 60) + "")) set_data_dev(t5, t5_value);

    			if (dirty & /*topTen*/ 4 && t7_value !== (t7_value = (/*topTen*/ ctx[2][1].fastestTime % 60 < 10
    			? "0" + /*topTen*/ ctx[2][1].fastestTime % 60
    			: /*topTen*/ ctx[2][1].fastestTime % 60) + "")) set_data_dev(t7, t7_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(hr);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div3);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(76:8) {#if topTen[1].position}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let main;
    	let div0;
    	let a;
    	let button0;
    	let t1;
    	let h1;
    	let t3;
    	let div2;
    	let div1;
    	let button1;
    	let t4;
    	let button1_class_value;
    	let t5;
    	let button2;
    	let t6;
    	let button2_class_value;
    	let t7;
    	let button3;
    	let t8;
    	let button3_class_value;
    	let t9;
    	let div7;
    	let div6;
    	let div3;
    	let t11;
    	let div4;
    	let t13;
    	let div5;
    	let t15;
    	let t16;
    	let t17;
    	let mounted;
    	let dispose;
    	let if_block0 = /*topTen*/ ctx[2][0].length == 0 && create_if_block_2$1(ctx);
    	let each_value = /*topTen*/ ctx[2][0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	let if_block1 = /*topTen*/ ctx[2][1].position && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			div0 = element("div");
    			a = element("a");
    			button0 = element("button");
    			button0.textContent = "Menu";
    			t1 = space();
    			h1 = element("h1");
    			h1.textContent = "MINESWEEPER";
    			t3 = space();
    			div2 = element("div");
    			div1 = element("div");
    			button1 = element("button");
    			t4 = text("Easy");
    			t5 = space();
    			button2 = element("button");
    			t6 = text("Medium");
    			t7 = space();
    			button3 = element("button");
    			t8 = text("Hard");
    			t9 = space();
    			div7 = element("div");
    			div6 = element("div");
    			div3 = element("div");
    			div3.textContent = "Position";
    			t11 = space();
    			div4 = element("div");
    			div4.textContent = "Username";
    			t13 = space();
    			div5 = element("div");
    			div5.textContent = "Best Time";
    			t15 = space();
    			if (if_block0) if_block0.c();
    			t16 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t17 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(button0, "class", "Menu-button svelte-1aq968v");
    			add_location(button0, file$3, 43, 21, 1416);
    			attr_dev(a, "href", "#/");
    			add_location(a, file$3, 43, 8, 1403);
    			attr_dev(h1, "class", "headline svelte-1aq968v");
    			add_location(h1, file$3, 44, 8, 1470);
    			attr_dev(div0, "class", "header svelte-1aq968v");
    			add_location(div0, file$3, 42, 4, 1374);

    			attr_dev(button1, "class", button1_class_value = "" + (null_to_empty(/*difficulty*/ ctx[1] == 'easy'
    			? 'diff-btn-selected'
    			: 'diff-btn') + " svelte-1aq968v"));

    			add_location(button1, file$3, 49, 12, 1577);

    			attr_dev(button2, "class", button2_class_value = "" + (null_to_empty(/*difficulty*/ ctx[1] == 'medium'
    			? 'diff-btn-selected'
    			: 'diff-btn') + " svelte-1aq968v"));

    			add_location(button2, file$3, 50, 12, 1707);

    			attr_dev(button3, "class", button3_class_value = "" + (null_to_empty(/*difficulty*/ ctx[1] == 'hard'
    			? 'diff-btn-selected'
    			: 'diff-btn') + " svelte-1aq968v"));

    			add_location(button3, file$3, 51, 12, 1843);
    			add_location(div1, file$3, 48, 8, 1559);
    			attr_dev(div2, "class", "difficulties svelte-1aq968v");
    			add_location(div2, file$3, 47, 4, 1524);
    			attr_dev(div3, "class", "position svelte-1aq968v");
    			add_location(div3, file$3, 56, 12, 2062);
    			attr_dev(div4, "class", "username svelte-1aq968v");
    			add_location(div4, file$3, 57, 12, 2111);
    			attr_dev(div5, "class", "bestTime svelte-1aq968v");
    			add_location(div5, file$3, 58, 12, 2160);
    			attr_dev(div6, "class", "headerContainer svelte-1aq968v");
    			add_location(div6, file$3, 55, 8, 2020);
    			attr_dev(div7, "class", "list svelte-1aq968v");
    			add_location(div7, file$3, 54, 4, 1993);
    			attr_dev(main, "class", "svelte-1aq968v");
    			add_location(main, file$3, 41, 0, 1363);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div0);
    			append_dev(div0, a);
    			append_dev(a, button0);
    			append_dev(div0, t1);
    			append_dev(div0, h1);
    			append_dev(main, t3);
    			append_dev(main, div2);
    			append_dev(div2, div1);
    			append_dev(div1, button1);
    			append_dev(button1, t4);
    			append_dev(div1, t5);
    			append_dev(div1, button2);
    			append_dev(button2, t6);
    			append_dev(div1, t7);
    			append_dev(div1, button3);
    			append_dev(button3, t8);
    			append_dev(main, t9);
    			append_dev(main, div7);
    			append_dev(div7, div6);
    			append_dev(div6, div3);
    			append_dev(div6, t11);
    			append_dev(div6, div4);
    			append_dev(div6, t13);
    			append_dev(div6, div5);
    			append_dev(div7, t15);
    			if (if_block0) if_block0.m(div7, null);
    			append_dev(div7, t16);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div7, null);
    				}
    			}

    			append_dev(div7, t17);
    			if (if_block1) if_block1.m(div7, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button1, "click", /*click_handler*/ ctx[5], false, false, false, false),
    					listen_dev(button2, "click", /*click_handler_1*/ ctx[6], false, false, false, false),
    					listen_dev(button3, "click", /*click_handler_2*/ ctx[7], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*difficulty*/ 2 && button1_class_value !== (button1_class_value = "" + (null_to_empty(/*difficulty*/ ctx[1] == 'easy'
    			? 'diff-btn-selected'
    			: 'diff-btn') + " svelte-1aq968v"))) {
    				attr_dev(button1, "class", button1_class_value);
    			}

    			if (dirty & /*difficulty*/ 2 && button2_class_value !== (button2_class_value = "" + (null_to_empty(/*difficulty*/ ctx[1] == 'medium'
    			? 'diff-btn-selected'
    			: 'diff-btn') + " svelte-1aq968v"))) {
    				attr_dev(button2, "class", button2_class_value);
    			}

    			if (dirty & /*difficulty*/ 2 && button3_class_value !== (button3_class_value = "" + (null_to_empty(/*difficulty*/ ctx[1] == 'hard'
    			? 'diff-btn-selected'
    			: 'diff-btn') + " svelte-1aq968v"))) {
    				attr_dev(button3, "class", button3_class_value);
    			}

    			if (/*topTen*/ ctx[2][0].length == 0) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_2$1(ctx);
    					if_block0.c();
    					if_block0.m(div7, t16);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty & /*topTen, username, handleMyTime, difficulty, Math*/ 23) {
    				each_value = /*topTen*/ ctx[2][0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div7, t17);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (/*topTen*/ ctx[2][1].position) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$1(ctx);
    					if_block1.c();
    					if_block1.m(div7, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block0) if_block0.d();
    			destroy_each(each_blocks, detaching);
    			if (if_block1) if_block1.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Leaderboard', slots, []);
    	let username;
    	let difficulty = 'easy';
    	let topTen = [[], Object];

    	onMount(async () => {
    		$$invalidate(0, username = await getUser());
    		$$invalidate(2, topTen = await getTopTen('easy'));
    		console.log(topTen);
    	}); // topTen = array of [{nickname, fastestTime}, fastestTime, position]
    	// second and third element belong to the signed in user

    	let update = async changeDifficulty => {
    		$$invalidate(1, difficulty = changeDifficulty);
    		$$invalidate(2, topTen = await getTopTen(changeDifficulty));
    		console.log(topTen[1].position);
    	};

    	let handleMyTime = async diff => {
    		await deleteTime(diff);
    		await update(diff);
    	};

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Leaderboard> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => update('easy');
    	const click_handler_1 = () => update('medium');
    	const click_handler_2 = () => update('hard');

    	$$self.$capture_state = () => ({
    		onMount,
    		getUser,
    		getTopTen,
    		deleteTime,
    		username,
    		difficulty,
    		topTen,
    		update,
    		handleMyTime
    	});

    	$$self.$inject_state = $$props => {
    		if ('username' in $$props) $$invalidate(0, username = $$props.username);
    		if ('difficulty' in $$props) $$invalidate(1, difficulty = $$props.difficulty);
    		if ('topTen' in $$props) $$invalidate(2, topTen = $$props.topTen);
    		if ('update' in $$props) $$invalidate(3, update = $$props.update);
    		if ('handleMyTime' in $$props) $$invalidate(4, handleMyTime = $$props.handleMyTime);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		username,
    		difficulty,
    		topTen,
    		update,
    		handleMyTime,
    		click_handler,
    		click_handler_1,
    		click_handler_2
    	];
    }

    class Leaderboard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Leaderboard",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/routes/notfound.svelte generated by Svelte v3.59.2 */

    const file$2 = "src/routes/notfound.svelte";

    function create_fragment$2(ctx) {
    	let main;
    	let h1;

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Page Not Found";
    			attr_dev(h1, "class", "headline svelte-1uga07o");
    			add_location(h1, file$2, 10, 4, 294);
    			attr_dev(main, "class", "svelte-1uga07o");
    			add_location(main, file$2, 9, 0, 283);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Notfound', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Notfound> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Notfound extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Notfound",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    const createUser = async (nickname) => {
      const response = await fetch("http://localhost:5000/api/user", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nickname: nickname,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create the user.");
      }

      const { newnickname } = await response.json();
      return newnickname;
    };

    /* src/routes/main_menu.svelte generated by Svelte v3.59.2 */
    const file$1 = "src/routes/main_menu.svelte";

    // (74:6) {#if nickname.length > 0 && nickname.length < 4}
    function create_if_block_3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Name must be at least 4 characters long");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(74:6) {#if nickname.length > 0 && nickname.length < 4}",
    		ctx
    	});

    	return block;
    }

    // (77:6) {#if nickname.length > 15}
    function create_if_block_2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Name must not exceed 15 characters");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(77:6) {#if nickname.length > 15}",
    		ctx
    	});

    	return block;
    }

    // (80:6) {#if visible}
    function create_if_block_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("You cannot play without a nickname");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(80:6) {#if visible}",
    		ctx
    	});

    	return block;
    }

    // (83:6) {#if exists}
    function create_if_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("This username already exists");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(83:6) {#if exists}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let div2;
    	let div0;
    	let t3;
    	let input;
    	let t4;
    	let p;
    	let t5;
    	let t6;
    	let t7;
    	let t8;
    	let button0;
    	let t10;
    	let a0;
    	let button1;
    	let t12;
    	let div1;
    	let a1;
    	let button2;
    	let t14;
    	let img;
    	let img_src_value;
    	let mounted;
    	let dispose;
    	let if_block0 = /*nickname*/ ctx[0].length > 0 && /*nickname*/ ctx[0].length < 4 && create_if_block_3(ctx);
    	let if_block1 = /*nickname*/ ctx[0].length > 15 && create_if_block_2(ctx);
    	let if_block2 = /*visible*/ ctx[1] && create_if_block_1(ctx);
    	let if_block3 = /*exists*/ ctx[2] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "MINESWEEPER";
    			t1 = space();
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "Enter your nickname:";
    			t3 = space();
    			input = element("input");
    			t4 = space();
    			p = element("p");
    			if (if_block0) if_block0.c();
    			t5 = space();
    			if (if_block1) if_block1.c();
    			t6 = space();
    			if (if_block2) if_block2.c();
    			t7 = space();
    			if (if_block3) if_block3.c();
    			t8 = space();
    			button0 = element("button");
    			button0.textContent = "Play";
    			t10 = space();
    			a0 = element("a");
    			button1 = element("button");
    			button1.textContent = "How to play";
    			t12 = space();
    			div1 = element("div");
    			a1 = element("a");
    			button2 = element("button");
    			button2.textContent = "Leaderboard";
    			t14 = space();
    			img = element("img");
    			attr_dev(h1, "class", "headline svelte-z73dka");
    			add_location(h1, file$1, 57, 2, 1515);
    			attr_dev(div0, "class", "enternick svelte-z73dka");
    			add_location(div0, file$1, 62, 4, 1592);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "nickname");
    			attr_dev(input, "class", "svelte-z73dka");
    			add_location(input, file$1, 63, 4, 1646);
    			attr_dev(p, "class", "nickname_err svelte-z73dka");
    			add_location(p, file$1, 72, 4, 1850);
    			add_location(button0, file$1, 87, 4, 2227);
    			add_location(button1, file$1, 88, 25, 2296);
    			attr_dev(a0, "href", "#/tutorial");
    			add_location(a0, file$1, 88, 4, 2275);
    			attr_dev(button2, "class", "leaderboard");
    			add_location(button2, file$1, 90, 30, 2369);
    			attr_dev(a1, "href", "#/leaderboard");
    			add_location(a1, file$1, 90, 6, 2345);
    			attr_dev(img, "class", "crownicon svelte-z73dka");
    			if (!src_url_equal(img.src, img_src_value = "img/crown-icon.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "not found");
    			add_location(img, file$1, 91, 6, 2428);
    			add_location(div1, file$1, 89, 4, 2333);
    			attr_dev(div2, "class", "menuitems svelte-z73dka");
    			add_location(div2, file$1, 61, 2, 1564);
    			attr_dev(main, "class", "svelte-z73dka");
    			add_location(main, file$1, 56, 0, 1506);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, div2);
    			append_dev(div2, div0);
    			append_dev(div2, t3);
    			append_dev(div2, input);
    			set_input_value(input, /*nickname*/ ctx[0]);
    			append_dev(div2, t4);
    			append_dev(div2, p);
    			if (if_block0) if_block0.m(p, null);
    			append_dev(p, t5);
    			if (if_block1) if_block1.m(p, null);
    			append_dev(p, t6);
    			if (if_block2) if_block2.m(p, null);
    			append_dev(p, t7);
    			if (if_block3) if_block3.m(p, null);
    			append_dev(div2, t8);
    			append_dev(div2, button0);
    			append_dev(div2, t10);
    			append_dev(div2, a0);
    			append_dev(a0, button1);
    			append_dev(div2, t12);
    			append_dev(div2, div1);
    			append_dev(div1, a1);
    			append_dev(a1, button2);
    			append_dev(div1, t14);
    			append_dev(div1, img);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[5]),
    					listen_dev(input, "input", /*input_handler*/ ctx[6], false, false, false, false),
    					listen_dev(input, "input", /*input_handler_1*/ ctx[7], false, false, false, false),
    					listen_dev(input, "keydown", /*handleEnter*/ ctx[4], false, false, false, false),
    					listen_dev(button0, "click", /*handlePlay*/ ctx[3], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*nickname*/ 1 && input.value !== /*nickname*/ ctx[0]) {
    				set_input_value(input, /*nickname*/ ctx[0]);
    			}

    			if (/*nickname*/ ctx[0].length > 0 && /*nickname*/ ctx[0].length < 4) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_3(ctx);
    					if_block0.c();
    					if_block0.m(p, t5);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*nickname*/ ctx[0].length > 15) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block_2(ctx);
    					if_block1.c();
    					if_block1.m(p, t6);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*visible*/ ctx[1]) {
    				if (if_block2) ; else {
    					if_block2 = create_if_block_1(ctx);
    					if_block2.c();
    					if_block2.m(p, t7);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (/*exists*/ ctx[2]) {
    				if (if_block3) ; else {
    					if_block3 = create_if_block(ctx);
    					if_block3.c();
    					if_block3.m(p, null);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Main_menu', slots, []);
    	let { nickname = "" } = $$props;
    	let visible = false;
    	let exists = false;

    	onMount(async () => {
    		$$invalidate(0, nickname = await getUser());
    		document.body.classList.remove('dark-bg');
    	});

    	// Called when "Play" button is clicked
    	const handlePlay = async () => {
    		if (nickname.length > 3 && nickname.length < 16) {
    			// username management
    			try {
    				const existingnick = await getUser();

    				if (existingnick != nickname) {
    					await createUser(nickname);
    					await generateBoard();
    				}

    				push("/game");
    			} catch(error) {
    				$$invalidate(2, exists = true);
    			}
    		} else if (nickname.length === 0) {
    			$$invalidate(1, visible = true); //
    		}
    	};

    	let handleEnter = event => {
    		if (event.key === "Enter") {
    			handlePlay();
    		}
    	};

    	const writable_props = ['nickname'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Main_menu> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		nickname = this.value;
    		$$invalidate(0, nickname);
    	}

    	const input_handler = () => $$invalidate(1, visible = false);
    	const input_handler_1 = () => $$invalidate(2, exists = false);

    	$$self.$$set = $$props => {
    		if ('nickname' in $$props) $$invalidate(0, nickname = $$props.nickname);
    	};

    	$$self.$capture_state = () => ({
    		push,
    		getUser,
    		createUser,
    		generateBoard,
    		onMount,
    		nickname,
    		visible,
    		exists,
    		handlePlay,
    		handleEnter
    	});

    	$$self.$inject_state = $$props => {
    		if ('nickname' in $$props) $$invalidate(0, nickname = $$props.nickname);
    		if ('visible' in $$props) $$invalidate(1, visible = $$props.visible);
    		if ('exists' in $$props) $$invalidate(2, exists = $$props.exists);
    		if ('handleEnter' in $$props) $$invalidate(4, handleEnter = $$props.handleEnter);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		nickname,
    		visible,
    		exists,
    		handlePlay,
    		handleEnter,
    		input_input_handler,
    		input_handler,
    		input_handler_1
    	];
    }

    class Main_menu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { nickname: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Main_menu",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get nickname() {
    		throw new Error("<Main_menu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set nickname(value) {
    		throw new Error("<Main_menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.59.2 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let router;
    	let current;

    	router = new Router({
    			props: { routes: /*routes*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(router.$$.fragment);
    			add_location(main, file, 19, 0, 456);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(router, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(router);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);

    	let routes = {
    		"/": Main_menu,
    		"/game": Game,
    		"/tutorial": Tutorial,
    		"/leaderboard": Leaderboard,
    		"*": Notfound
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Router,
    		Game,
    		Tutorial,
    		Leaderboard,
    		Notfound,
    		MainMenu: Main_menu,
    		routes
    	});

    	$$self.$inject_state = $$props => {
    		if ('routes' in $$props) $$invalidate(0, routes = $$props.routes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [routes];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
