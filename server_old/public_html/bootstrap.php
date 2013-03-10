<?php
/**
 * User: dpetek
 * Date: 2/2/13
 * Time: 7:13 PM
 */

require_once __DIR__ . '/../app/core/Settings.php';
require_once __DIR__ . '/../app/core/DB.php';

define ("__APP_PATH", __DIR__ . '/../app');
define ("SITE_URL", "dev.public.com");

DB::init();

function defineAutoLoadStructure($filename)
{
	$list = array (
		__APP_PATH . 'models/' . $filename,
		__APP_PATH . 'core/' . $filename,
	);

	foreach ($list as $item) {
		if (is_file($item)) {
			require $item;
			return true;
		}
	}
	return false;
}

spl_autoload_register('defineAutoLoadStructure');
