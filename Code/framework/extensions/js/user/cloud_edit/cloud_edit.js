/*
    GreyOS - Cloud Edit (Version: 2.5)

    File name: cloud_edit.js
    Description: This file contains the Cloud Edit - Code editor application.

    Coded by George Delaportas (G0D)
    Copyright © 2013 - 2024
    Open Software License (OSL 3.0)
*/

// Cloud Edit
function cloud_edit()
{
    var self = this;

    function config_model()
    {
        function program_model()
        {
            this.icon = '';
            this.name = '';
            this.type = null;
        }

        function ce_model()
        {
            this.editor = null;
            this.extra_button = null;
            this.exec_button = null;
            this.deploy_button = null;
            this.status_label = null;
        }

        this.id = null;
        this.content = null;
        this.program = new program_model();
        this.ce = new ce_model();
    }

    function ce_meta_caller()
    {
        this.telemetry = function(data)
        {
            config.program.icon = encodeURIComponent(data.icon);
            config.program.name = encodeURIComponent(data.name);
            config.program.type = data.type;

            return true;
        };

        this.source = function()
        {
            return config.ce.editor.getValue();
        };

        this.reset = function()
        {
            return utils_int.reset();
        };
    }

    function utilities()
    {
        var me = this;

        function run_code(event_object)
        {
            var __code = null;

            if (utils_sys.validation.misc.is_undefined(event_object))
                return false;

            if (program_is_running === true)
                return utils_int.reset();

            __code = config.ce.editor.getValue();

            if (!meta_executor.load(__code))
            {
                config.ce.status_label.innerHTML = '[EMPTY]';
                config.ce.exec_button.value = 'Run';
                config.ce.exec_button.classList.remove('ce_stop');

                frog('CLOUD EDIT', '% Empty %', 
                     'No code detected!');

                return false;
            }

            if (meta_executor.process(ce_mc) !== true)
            {
                if (meta_executor.error.last.code() === meta_executor.error.codes.INVALID)
                {
                    config.ce.status_label.innerHTML = '[INVALID]';
                    config.ce.exec_button.value = 'Run';
                    config.ce.exec_button.classList.remove('ce_stop');

                    frog('CLOUD EDIT', '% Invalid %', 
                         meta_executor.error.last.message() + '\nPlease check the template...');
                }
                else if (meta_executor.error.last.code() === meta_executor.error.codes.MISMATCH)
                {
                    config.ce.status_label.innerHTML = '[ERROR]';
                    config.ce.exec_button.value = 'Run';
                    config.ce.exec_button.classList.remove('ce_stop');

                    frog('CLOUD EDIT', '[!] Error [!]', meta_executor.error.last.message());
                }
                else if (meta_executor.error.last.code() === meta_executor.error.codes.OTHER)
                {
                    config.ce.status_label.innerHTML = '[ERROR]';
                    config.ce.exec_button.value = 'Run';
                    config.ce.exec_button.classList.remove('ce_stop');

                    frog('CLOUD EDIT', '[!] Error [!]', meta_executor.error.last.message());
                }

                disable_deploy_button();

                return meta_executor.terminate();
            }

            config.ce.status_label.innerHTML = '[RUNNING]';
            config.ce.exec_button.value = 'Stop';
            config.ce.exec_button.classList.add('ce_stop');

            disable_deploy_button();

            program_is_running = true;

            return true;
        }

        function side_panel(event_object)
        {
            if (cloud_edit_bee.status.gui.casement_deployed())
                cloud_edit_bee.gui.actions.casement.retract(event_object);
            else
                cloud_edit_bee.gui.actions.casement.deploy(event_object);
        }

        function deploy_program()
        {
            function save_program()
            {
                user_prog_name = encodeURIComponent(utils_sys.objects.by_id('input_prog_name').value);
                __prog_source = encodeURIComponent(config.ce.editor.getValue());

                if (user_prog_name.length === 0)
                {
                    msg_win = new msgbox();

                    msg_win.init('desktop');
                    msg_win.show(os_name, 'Please enter a program name!', msg_win.types.OK,
                                 [() => { user_prog_name = 'new_program'; deploy_program(); }]);

                    return;
                }

                var __verification_options = "&program_type=" + config.program.type + "&program_name=" + user_prog_name;

                __ajax_config.data += __verification_options;

                __prog_model = JSON.stringify(config.program);

                ajax.run(__ajax_config)
            }

            var __prog_source = null,
                __prog_model = null,
                __input_prog_name_object = null,
                __handler = null,
                __ajax_config = {
                                    "type"          :   "request",
                                    "method"        :   "post",
                                    "url"           :   "/",
                                    "data"          :   "gate=deploy_program&check_existing=1",
                                    "ajax_mode"     :   "asynchronous",
                                    "on_success"    :   (result) => 
                                                        {
                                                            msg_win = new msgbox();

                                                            msg_win.init('desktop');

                                                            if (result === '-1')
                                                            {
                                                                msg_win.show(os_name, 'An error has occurred!');

                                                                return;
                                                            }

                                                            __ajax_config.data = "gate=deploy_program&program_name=" + user_prog_name + 
                                                                                 "&program_source=" + __prog_source + "&program_model=" + __prog_model;
                                                            __ajax_config.on_success = (result) =>
                                                                                       {
                                                                                            if (result === '-1')
                                                                                            {
                                                                                                msg_win = new msgbox();

                                                                                                msg_win.init('desktop');

                                                                                                msg_win.show(os_name, 'An error has occurred.\
                                                                                                                       The program has not been saved!');

                                                                                                return;
                                                                                            }
                                                                                            else
                                                                                                dock.refresh();
                                                                                       };

                                                            if (result === '0')
                                                                ajax.run(__ajax_config);
                                                            else
                                                            {
                                                                msg_win.show(os_name, 'This program name already exists!<br>\
                                                                                       Do you want to replace it with the current program?', 
                                                                                       msg_win.types.YES_NO_CANCEL, 
                                                                                       [() => { ajax.run(__ajax_config); }, 
                                                                                        () => { deploy_program(); },
                                                                                        () => {  }]);
                                                            }
                                                        }
                                };

            msg_win = new msgbox();

            msg_win.init('desktop');
            msg_win.show(os_name, 'Please save your program before deploying it.<br><br>\
                                   <input id="input_prog_name" class="ce_prog_name_input" value="' + decodeURIComponent(user_prog_name) + '"\
                                   maxlength="40" placeholder="Enter program name...">', 
                                   msg_win.types.OK_CANCEL, [() => { save_program(); }]);

            __input_prog_name_object = utils_sys.objects.by_id('input_prog_name');

            __input_prog_name_object.focus();

            __handler = function(event)
            {
                key_control.scan(event);

                if (key_control.get() === key_control.keys.ENTER)
                    save_program();
            };
            morpheus.run(__input_prog_name_object.id, 'key', 'keydown', __handler, __input_prog_name_object);

            return true;
        }

        function disable_deploy_button()
        {
            config.ce.deploy_button.style.color = '';
            config.ce.deploy_button.style.backgroundColor = '#97ad9c';
            config.ce.deploy_button.disabled = true;
        }

        this.gui_init = function()
        {
            var __data_content_id = cloud_edit_bee.settings.general.id()  + '_data';

            infinity.setup(__data_content_id);
            infinity.begin();

            me.draw();
            me.attach_ce_functions();
            me.attach_events();

            infinity.end();

            return true;
        };

        this.draw = function()
        {
            var dynamic_elements = document.createElement('span');

            config.ce.extra_button = document.createElement('input');
            config.ce.extra_button.id = 'ce_extra';
            config.ce.extra_button.type = 'button';
            config.ce.extra_button.value = '>>';
            config.ce.extra_button.title = 'Show / hide side panel';

            config.ce.exec_button = document.createElement('input');
            config.ce.exec_button.id = 'ce_run_stop';
            config.ce.exec_button.type = 'button';
            config.ce.exec_button.value = 'Run';
            config.ce.exec_button.title = 'Run program';

            config.ce.deploy_button = document.createElement('input');
            config.ce.deploy_button.id = 'ce_deploy';
            config.ce.deploy_button.type = 'button';
            config.ce.deploy_button.style.backgroundColor = '#97ad9c';
            config.ce.deploy_button.value = 'Deploy';
            config.ce.deploy_button.title = 'Deploy program to AGORA marketplace';
            config.ce.deploy_button.disabled = true;

            config.ce.status_label = document.createElement('span');
            config.ce.status_label.id = 'ce_status';
            config.ce.status_label.innerHTML = '[READY]';

            dynamic_elements.append(config.ce.status_label);
            dynamic_elements.append(config.ce.deploy_button);
            dynamic_elements.append(config.ce.exec_button);
            dynamic_elements.append(config.ce.extra_button);

            // TODO: Create log & programs list in casement...

            utils_sys.objects.by_id(cloud_edit_bee.settings.general.id() + '_status_bar_msg').append(dynamic_elements);

            return true;
        };

        this.attach_ce_functions = function()
        {
            config.ce.editor = ace.edit(cloud_edit_bee.settings.general.id() + '_data');

            ace.require('ace/ext/settings_menu').init(config.ce.editor);

            config.ce.editor.setTheme('ace/theme/tomorrow_night');
            config.ce.editor.session.setMode('ace/mode/javascript');
            config.ce.editor.setOptions({ enableBasicAutocompletion: true, 
                                          enableSnippets: true, 
                                          enableLiveAutocompletion: true, 
                                          printMargin: false, 
                                          vScrollBarAlwaysVisible: true, 
                                          fontSize: '14' 
                                        });
            config.ce.editor.commands.addCommands([ { name: 'showSettingsMenu', bindKey: {win: 'Ctrl-q', mac: 'Ctrl-q'}, 
                                                      exec: function(this_editor) { this_editor.showSettingsMenu(); } } ]);
            config.ce.editor.getSession().on('change', () => { disable_deploy_button(); });

            return true;
        };

        this.attach_events = function()
        {
            var __handler = null;

            __handler = function(event) { side_panel(event); };
            morpheus.run(config.ce.extra_button.id, 'mouse', 'click', __handler, config.ce.extra_button);

            __handler = function(event) { run_code(event); };
            morpheus.run(config.ce.exec_button.id, 'mouse', 'click', __handler, config.ce.exec_button);

            __handler = function() { deploy_program(); };
            morpheus.run(config.ce.deploy_button.id, 'mouse', 'click', __handler, config.ce.deploy_button);

            return true;
        };

        this.reset = function()
        {
            meta_executor.terminate();

            config.ce.status_label.innerHTML = '[READY]';
            config.ce.exec_button.value = 'Run';
            config.ce.exec_button.classList.remove('ce_stop');

            config.ce.deploy_button.style.color = '#ffffff';
            config.ce.deploy_button.style.backgroundColor = '#08d43b';
            config.ce.deploy_button.disabled = false;

            program_is_running = false;

            return true;
        };

        this.destroy_editor = function()
        {
            config.ce.editor.destroy();

            return true;
        };
    }

    this.base = function()
    {
        if (is_init === false)
            return false;

        return cloud_edit_bee;
    };

    this.on = function(event_name, event_handler)
    {
        if (is_init === false)
            return false;

        return cloud_edit_bee.on(event_name, event_handler);
    };

    this.run = function()
    {
        if (is_init === false)
            return false;

        return cloud_edit_bee.run();
    };

    this.quit = function()
    {
        if (is_init === false)
            return false;

        return cloud_edit_bee.close();
    };

    this.error = function()
    {
        if (is_init === false)
            return false;

        return cloud_edit_bee.error;
    };

    this.init = function()
    {
        if (utils_sys.validation.misc.is_nothing(cosmos))
            return false;

        if (is_init === true)
            return false;

        is_init = true;

        os_name = xenon.load('os_name');

        cloud_edit_bee = dev_box.get('bee');

        config.id = 'cloud_edit';
        config.content = `// Welcome to Cloud Edit!\n// Please load the test template from \
                          https://greyos.gr/framework/extensions/js/core/cloud_edit/my_ms_program.js\n`;

        nature.theme([config.id]);
        nature.apply('new');

        infinity.init();

        // Declare bee's settings
        cloud_edit_bee.init(config.id);
        cloud_edit_bee.settings.data.window.labels.title('Cloud Edit');
        cloud_edit_bee.settings.data.window.labels.status_bar('Integrated code editor for GreyOS');
        cloud_edit_bee.settings.data.window.content(config.content);
        cloud_edit_bee.settings.data.casement.labels.title('Side Panel :: Utilities');
        cloud_edit_bee.settings.data.casement.labels.status('Ready');
        cloud_edit_bee.settings.actions.can_edit_title(false);
        cloud_edit_bee.settings.general.allowed_instances(4);
        cloud_edit_bee.settings.general.casement_width(40);
        cloud_edit_bee.gui.position.left(330);
        cloud_edit_bee.gui.position.top(80);
        cloud_edit_bee.gui.size.width(800);
        cloud_edit_bee.gui.size.height(530);
        cloud_edit_bee.gui.fx.fade.settings.into.set(0.07, 25, 100);
        cloud_edit_bee.gui.fx.fade.settings.out.set(0.07, 25, 100);
        cloud_edit_bee.on('open', function() { cloud_edit_bee.gui.fx.fade.into(); });
        cloud_edit_bee.on('opened', function() { utils_int.gui_init(); });
        cloud_edit_bee.on('dragging', function()
                                      {
                                          cloud_edit_bee.gui.fx.opacity.settings.set(0.7);
                                          cloud_edit_bee.gui.fx.opacity.apply();
                                      });
        cloud_edit_bee.on('dragged', function() { cloud_edit_bee.gui.fx.opacity.reset(); });
        cloud_edit_bee.on('casement_deployed', function() { config.ce.extra_button.value = '<<'; });
        cloud_edit_bee.on('casement_retracted', function() { config.ce.extra_button.value = '>>'; });
        cloud_edit_bee.on('close', function()
                                   {
                                       cloud_edit_bee.gui.fx.fade.out();

                                       meta_executor.terminate();

                                       utils_int.destroy_editor();
                                   });

        return true;
    };

    this.cosmos = function(cosmos_object)
    {
        if (utils_sys.validation.misc.is_undefined(cosmos_object))
            return false;

        cosmos = cosmos_object;

        matrix = cosmos.hub.access('matrix');
        dev_box = cosmos.hub.access('dev_box');
        colony = cosmos.hub.access('colony');

        morpheus = matrix.get('morpheus');
        xenon = matrix.get('xenon');
        nature = matrix.get('nature');
        dock = matrix.get('dock');
        infinity = dev_box.get('infinity');

        meta_executor = dev_box.get('meta_executor');

        return true;
    };

    var is_init = false,
        program_is_running = false,
        user_prog_name = 'new_program',
        os_name = null,
        cosmos = null,
        matrix = null,
        dev_box = null,
        colony = null,
        morpheus = null,
        xenon = null,
        dock = null,
        nature = null,
        infinity = null,
        meta_executor = null,
        cloud_edit_bee = null,
        config = new config_model(),
        ce_mc = new ce_meta_caller(),
        utils_int = new utilities(),
        utils_sys = new vulcan(),
        key_control = new key_manager(),
        ajax = new taurus(),
        msg_win = new msgbox();
}
