<?php
    /*
        GreyOS - HYPERBEAM (Programmable gate for HYPERBEAM session managment)

        File name: hyperbeam.php
        Description: This file contains the HYPERBEAM session managment gate (AJAX).

        Coded by George Delaportas (G0D)
        Copyright © 2023
        Open Software License (OSL 3.0)
    */

    // Check for direct access
    if (!defined('micro_mvc'))
        exit();

    UTIL::Load_Extension('portal', 'php');

    function hb_list_sessions()
    {
        $hb_results = Portal('https://engine.hyperbeam.com/v0/vm', 'GET', 
                             array('Authorization' => 'Bearer sk_test_x2htm0Ivk146Nz_5vr0EHAtATM6lafKkO5lSDZspPsE'));

        return json_decode($hb_results, true);
    }

    function hb_new_session($config)
    {
        $hb_results = Portal('https://engine.hyperbeam.com/v0/vm', 'POST', 
                             array('Authorization' => 'Bearer sk_test_x2htm0Ivk146Nz_5vr0EHAtATM6lafKkO5lSDZspPsE'), 
                             $config);

        return json_decode($hb_results, true);
    }

    function hb_reload_session($session_id)
    {
        $hb_results = Portal('https://engine.hyperbeam.com/v0/vm', 'POST', 
                             array('Authorization' => 'Bearer sk_test_x2htm0Ivk146Nz_5vr0EHAtATM6lafKkO5lSDZspPsE'), 
                             '{"profile":{"load": "' . $session_id . '"}}');

        return json_decode($hb_results, true);
    }

    function hb_terminate_session($session_id)
    {
        return  Portal('https://engine.hyperbeam.com/v0/vm/' . $session_id, 'DELETE', 
                       array('Authorization' => 'Bearer sk_test_x2htm0Ivk146Nz_5vr0EHAtATM6lafKkO5lSDZspPsE'));

    }

    if (isset($_POST['config']))
    {
        $hb_results_array = hb_list_sessions();

        if (empty($hb_results_array['next']))
        {
            $hb_results_array = hb_new_session($_POST['config']);

            echo $hb_results_array['embed_url'];
        }
        else
        {
            $hb_results_array = hb_reload_session($hb_results_array['next']);

            if (isset($hb_results_array['code']))
            {
                hb_terminate_session($hb_results_array['next']);

                $hb_results_array = hb_new_session($_POST['config']);

                echo $hb_results_array['embed_url'];
            }
            else
                echo $hb_results_array['embed_url'];
        }
    }
    else if (isset($_POST['terminate']))
        echo hb_terminate_session($_POST['terminate']);
    else
        echo '0';
?>