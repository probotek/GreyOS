/*
    GreyOS - Dock (Version: 1.6)
    
    File name: dock.js
    Description: This file contains the Dock module.
    
    Coded by John Inglessis (negle) and George Delaportas (G0D)
    Copyright © 2013 - 2021
    Open Software License (OSL 3.0)
*/

// Dock
function dock()
{
    var self = this;

    function config_model()
    {
        this.dock_array = [];
    }

    function settings()
    {
        var __id = null,
            __container = null;

        this.id = function(val)
        {
            if (is_init === false)
                return false;

            if (utils_sys.validation.misc.is_undefined(val))
                return __id;

            if (utils_sys.validation.alpha.is_symbol(val))
                return false;

            __id = val;

            return true;
        };

        this.container = function(val)
        {
            if (is_init === false)
                return false;

            if (utils_sys.validation.misc.is_undefined(val))
                return __container;

            if (utils_sys.validation.alpha.is_symbol(val))
                return false;

            __container = val;

            return true;
        };
    }

    function utilities()
    {
        var me = this;

        function ajax_load(element_id, success_callback, time_out_callback = null, fail_callback = null)
        {
            if (element_id === undefined)
                return false;

            var __bull_config = {
                                    "type"                  :   "data",
                                    "url"                   :   "/",
                                    "data"                  :   "gate=dock&action=load",
                                    "element_id"            :   element_id,
                                    "content_fill_mode"     :   "replace",
                                    "on_success"            :   function()
                                                                {
                                                                    success_callback.apply();
                                                                },
                                    "on_timeout"            :   function()
                                                                {
                                                                    if (time_out_callback !== null)
                                                                        time_out_callback.apply();
                                                                },
                                    "on_fail"               :   function()
                                                                {
                                                                    if (fail_callback !== null)
                                                                        fail_callback.apply();
                                                                }
                                };

            ajax.run(__bull_config);

            return true;
        }

        function ajax_save(apps_array)
        {
            var __bull_config = {
                                    "type"          :   "request",
                                    "url"           :   "/",
                                    "data"          :   "gate=dock&action=save&apps=" + apps_array,
                                    "ajax_mode"     :   "synchronous",
                                };

            return ajax.run(__bull_config);
        }

        function create_dock_array()
        {
            var __app_id = null,
                __position = null,
                __title = null
                __dock = utils_sys.objects.by_class('favorites'),
                __dock_length = __dock.length;

            for (var __dock_app of __dock)
            {
                __app_id = __dock_app.getAttribute('id').split('app_')[1],
                __position = __dock_app.getAttribute('data-position'),
                __title = __dock_app.getAttribute('title');

                config.dock_array.push({ "app_id" : __app_id, "position" : __position, "title" : __title });
            }

            return true;
        }

        function attach_events()
        {
            for (var __dock_app of config.dock_array)
                open_app(__dock_app);

            return true;
        }

        function enable_drag()
        {
            var __dock_div = utils_sys.objects.by_id(self.settings.container()),
                __dock_apps = utils_sys.objects.selectors.all('#top_panel #bottom_area #dynamic_container #favorite_apps .favorites'),
                __dock_apps_length = __dock_apps.length;

            for (var i = 0; i < __dock_apps_length; i++)
            {
                __handler = function(event)
                            {
                                last_button_clicked = event.buttons;
                            };
                utils_sys.events.attach('dock', __dock_apps[i], 'mousedown', __handler);

                __handler = function(event)
                            {
                                is_dragging = true;

                                event.dataTransfer.setDragImage(this, -5, -5);
                                event.dataTransfer.effectAllowed = 'move';
                                event.dataTransfer.setData('text/plain', event.target.id);

                                for (var j = 0; j < __dock_apps_length; j++)
                                    __dock_apps[j].classList.add('dock_replace');
                            };
                utils_sys.events.attach('dock', __dock_apps[i], 'dragstart', __handler);

                __handler = function(event)
                            {
                                event.preventDefault();

                                event.dataTransfer.dropEffect = 'move';
                            };
                utils_sys.events.attach('dock', __dock_apps[i], 'dragover', __handler);

                __handler = function(event)
                            {
                                event.preventDefault();

                                event.target.classList.add('dock_replace_outer');
                            };
                utils_sys.events.attach('dock', __dock_apps[i], 'dragenter', __handler);

                __handler = function()
                            {
                                this.classList.remove('dock_replace_outer');
                            };
                utils_sys.events.attach('dock', __dock_apps[i], 'dragleave', __handler);

                __handler = function()
                            {
                                is_dragging = false;

                                for (var j = 0; j < __dock_apps_length; j++)
                                {
                                    __dock_apps[j].classList.remove('dock_replace_outer');
                                    __dock_apps[j].classList.remove('dock_replace');
                                }
                            };
                utils_sys.events.attach('dock', __dock_apps[i], 'dragend', __handler);

                __handler = function(event)
                            {
                                if (event.target.id !== event.dataTransfer.getData('text/plain'))
                                {
                                    var __id = event.dataTransfer.getData('text/plain'),
                                        __app_to_move = utils_sys.objects.by_id(__id),
                                        __app_to_move_next = __app_to_move.nextSibling,
                                        __app_to_replace = utils_sys.objects.by_id(this.id),
                                        __position_one = __app_to_move.getAttribute('data-position'),
                                        __position_two = event.target.getAttribute('data-position');

                                    __app_to_move.setAttribute('data-position', __position_two); 

                                    event.target.setAttribute('data-position', __position_one);

                                    __dock_div.insertBefore(__app_to_move, __app_to_replace.nextSibling);
                                    __dock_div.insertBefore(__app_to_replace, __app_to_move_next);

                                    update_dock_array(__position_one, __position_two);

                                    me.save_dock();
                                }
                            };
                utils_sys.events.attach('dock', __dock_apps[i], 'drop', __handler);
            }
        }

        function update_dock_array(position_one, position_two)
        {
            var tmp = config.dock_array[position_one];

            config.dock_array[position_one] = config.dock_array[position_two];
            config.dock_array[position_two] = tmp;
            config.dock_array[position_one]['position'] = position_one;
            config.dock_array[position_two]['position'] = position_two;

            return true;
        }

        function open_app(dock_app)
        {
            var __handler = null;

            __handler = function(event)
                        {
                            if (event.buttons === 0 && last_button_clicked !== 1)
                                return false;

                            if (is_dragging)
                                return false;

                            var __bee = colony.get(dock_app['app_id']),
                                __sys_theme = chameleon.get();

                            if (__bee === null || __bee === false)
                            {
                                var __app = app_box.get(dock_app['app_id']);

                                __app.init();

                                __bee = __app.get_bee();

                                parrot.play('action', '/site/themes/' + __sys_theme + '/sounds/button_click.mp3');

                                swarm.bees.insert(__bee);

                                __bee.show();

                                utils_sys.objects.by_id('app_' + dock_app['app_id']).classList.remove('app_' + dock_app['app_id'] + '_off');
                                utils_sys.objects.by_id('app_' + dock_app['app_id']).classList.add('app_' + dock_app['app_id'] + '_on');

                                close_app(__bee, dock_app['app_id']);
                            }
                            else
                            {
                                if (!__bee.status.system.running())
                                {
                                    parrot.play('action', '/site/themes/' + __sys_theme + '/sounds/button_click.mp3');

                                    __bee.show();

                                    utils_sys.objects.by_id('app_' + dock_app['app_id']).classList.remove('app_' + dock_app['app_id'] + '_off');
                                    utils_sys.objects.by_id('app_' + dock_app['app_id']).classList.add('app_' + dock_app['app_id'] + '_on');

                                    close_app(__bee, dock_app['app_id']);
                                }
                            }
                        };
            utils_sys.objects.by_id('app_' + dock_app['app_id']).onmouseup = __handler;
        }

        function close_app(bee, app_id)
        {
            bee.on('closed', function()
                             {
                                if (owl.status.get.by_app_id(app_id, 'RUN'))
                                    return false;

                                utils_sys.objects.by_id('app_' + app_id).classList.remove('app_' + app_id + '_on');
                                utils_sys.objects.by_id('app_' + app_id).classList.add('app_' + app_id + '_off');

                                return true;
                             });
        }

        this.draw = function()
        {
            ajax_load(self.settings.container(), function()
                                                 {
                                                    create_dock_array();
                                                    attach_events();
                                                    enable_drag();
                                                 });

            return true;
        };

        this.save_dock = function()
        {   
            var __dock_array = encodeURIComponent(JSON.stringify(config.dock_array));

           return ajax_save(__dock_array);
        };
    }

    this.add = function()
    {
        if (is_init === false)
            return false;

        return true;
    };

    this.remove = function()
    {
        if (is_init === false)
            return false;

        return true;
    };

    this.init = function(container_id)
    {
        if (utils_sys.validation.misc.is_nothing(cosmos))
            return false;

        if (is_init === true)
           return false;

        if (utils_sys.validation.misc.is_undefined(container_id) || 
            utils_sys.validation.alpha.is_symbol(container_id) || 
            utils_sys.objects.by_id(container_id) === null)
            return false;

        is_init = true;

        self.settings.id('dock_' + random.generate());
        self.settings.container(container_id);

        nature.theme('dock');
        nature.apply('new');

        utils_int.draw();

        return true;
    };

    this.cosmos = function(cosmos_object)
    {
        if (utils_sys.validation.misc.is_undefined(cosmos_object))
            return false;

        cosmos = cosmos_object;

        matrix = cosmos.hub.access('matrix');
        app_box = cosmos.hub.access('app_box');
        colony = cosmos.hub.access('colony');

        swarm = matrix.get('swarm');
        hive = matrix.get('swarm');
        owl = matrix.get('owl');
        parrot = matrix.get('parrot');
        chameleon = matrix.get('chameleon');
        nature = matrix.get('nature');

        return true;
    };

    var is_init = false,
        is_dragging = false,
        cosmos = null,
        matrix = null,
        swarm = null,
        hive = null,
        app_box = null,
        colony = null,
        owl = null,
        parrot = null,
        chameleon = null,
        nature = null,
        last_button_clicked = 0,
        utils_sys = new vulcan(),
        ajax = new bull(),
        random = new pythia(),
        config = new config_model(),
        utils_int = new utilities();

    this.settings = new settings();
}