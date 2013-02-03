<?php
/**
 * User: dpetek
 * Date: 2/2/13
 * Time: 7:44 PM
 */

class DB
{
	private static $pdoAdapter;

	public function __construct()
	{

	}

	public static function init()
	{
//		$host = Settings::DB_HOST;
//		$dbName = Settings::DB_NAME;
//		self::$pdoAdapter = new PDO("mysql:host={$host};dbname={$dbName}", Settings::DB_USERNAME, Settings::DB_PASSWORD);
	}

	public static function connection()
	{
		return self::$pdoAdapter;
	}
}