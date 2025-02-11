<?php
/**
 * Plugin Name: The SEO Machine
 * Plugin URI: https://jnjsite.com/the-seo-machine-for-wordpress/
 * License: GPLv2 or later
 * Description: A SEO machine to study and improve your WordPress website.
 * Version: 0.5
 * Author: Jaime Niñoles
 * Author URI: https://jnjsite.com/.
 */
defined('ABSPATH') or die('No no no');
define('TSM_PATH', plugin_dir_path(__FILE__));

include_once TSM_PATH.'the-seo-machine-database.php';
include_once TSM_PATH.'the-seo-machine-core.php';
include_once TSM_PATH.'the-seo-machine-backend-controller.php';
include_once TSM_PATH.'the-seo-machine-ajax-controller.php';

class TheSeoMachine
{
    private static $instance;

    public static function get_instance()
    {
        if (!isset(self::$instance)) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    private function __construct()
    {
        // Activation and deactivation..
        register_activation_hook(__FILE__, [$this, 'activation']);
        register_deactivation_hook(__FILE__, [$this, 'deactivation']);

        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_css_js']);

        TheSeoMachineDatabase::get_instance();
        TheSeoMachineCore::get_instance();
        TheSeoMachineBackendController::get_instance();
        TheSeoMachineAjaxController::get_instance();
    }

    public function activation()
    {
        register_setting('tsm_options_group', 'tsm_db_version');
        register_setting('tsm_options_group', 'tsm_quantity_per_batch');
        register_setting('tsm_options_group', 'tsm_time_between_batches');
        register_setting('tsm_options_group', 'tsm_current_columns_to_show');
        register_setting('tsm_options_group', 'tsm_crawl_type');
        register_setting('tsm_options_group', 'tsm_autoreload_datatables');

        add_option('tsm_db_version', 0);
        add_option('tsm_quantity_per_batch', '2');
        add_option('tsm_time_between_batches', '30');
        add_option('tsm_current_columns_to_show', 'id,url,found_in_url,updated_at,level,title,http_code,time_consumed');
        add_option('tsm_crawl_type', 'in-width');
        add_option('tsm_autoreload_datatables', -1);

        TheSeoMachineDatabase::get_instance()->create_initial_tables();
    }

    public function deactivation()
    {
        TheSeoMachineDatabase::get_instance()->remove_tables();

        unregister_setting('tsm_options_group', 'tsm_db_version');
    }

    public function uninstall()
    {
        delete_option('tsm_db_version');
        delete_option('tsm_quantity_per_batch');
        delete_option('tsm_time_between_batches');
        delete_option('tsm_current_columns_to_show');
    }

    /**
     * It adds assets only for the backend..
     */
    public function enqueue_admin_css_js()
    {
        if (isset($_GET['page']) and 'the-seo-machine' == $_GET['page']) {
            wp_enqueue_style('tsm_style_datatables', plugin_dir_url(__FILE__).'lib/datatables.min.css', false, '0.1');
            wp_enqueue_style('tsm_custom_style', plugin_dir_url(__FILE__).'lib/tsm.min.css', false, '0.1.4');

            wp_enqueue_script('tsm_script_pdfmake', plugin_dir_url(__FILE__).'lib/pdfmake.min.js', [], '0.1');
            wp_enqueue_script('tsm_script_vfs_fonts', plugin_dir_url(__FILE__).'lib/vfs_fonts.js', [], '0.1');
            wp_enqueue_script('tsm_script_datatables', plugin_dir_url(__FILE__).'lib/datatables.min.js', [], '0.1');
            wp_enqueue_script('tsm_script_chart', plugin_dir_url(__FILE__).'lib/Chart.min.js', [], '0.1');
            wp_enqueue_script('tsm_custom_script', plugin_dir_url(__FILE__).'lib/tsm.min.js', [], '0.1.4');
        }
    }
}

// Do all..
TheSeoMachine::get_instance();
