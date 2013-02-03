<?php
/**
 * User: dpetek
 * Date: 2/2/13
 * Time: 7:42 PM
 */

abstract class BaseModel
{
	protected $fields;

	public function __construct(array $data)
	{

	}

	public function save(){}

	public function load() {}

	public function __connection()
	{

	}
}