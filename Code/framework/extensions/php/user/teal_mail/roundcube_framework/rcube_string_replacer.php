<?php

/*
 +-----------------------------------------------------------------------+
 | This file is part of the Roundcube Webmail client                     |
 | Copyright (C) 2009-2012, The Roundcube Dev Team                       |
 |                                                                       |
 | Licensed under the GNU General Public License version 3 or            |
 | any later version with exceptions for skins & plugins.                |
 | See the README file for a full license statement.                     |
 |                                                                       |
 | PURPOSE:                                                              |
 |   Handle string replacements based on preg_replace_callback           |
 +-----------------------------------------------------------------------+
 | Author: Thomas Bruederli <roundcube@gmail.com>                        |
 +-----------------------------------------------------------------------+
*/

/**
 * Helper class for string replacements based on preg_replace_callback
 *
 * @package    Framework
 * @subpackage Utils
 */
class rcube_string_replacer
{
    public static $pattern = '/##str_replacement\[([0-9]+)\]##/';
    public $mailto_pattern;
    public $link_pattern;
    private $values = array();


    function __construct()
    {
        // Simplified domain expression for UTF8 characters handling
        // Support unicode/punycode in top-level domain part
        $utf_domain = '[^?&@"\'\\/()<>\s\r\t\n]+\\.?([^\\x00-\\x2f\\x3b-\\x40\\x5b-\\x60\\x7b-\\x7f]{2,}|xn--[a-zA-Z0-9]{2,})';
        $url1       = '.:;,';
        $url2       = 'a-zA-Z0-9%=#$@+?|!&\\/_~\\[\\]\\(\\){}\*-';

        $this->link_pattern = "/([\w]+:\/\/|\W[Ww][Ww][Ww]\.|^[Ww][Ww][Ww]\.)($utf_domain([$url1]*[$url2]+)*)/";
        $this->mailto_pattern = "/("
            ."[-\w!\#\$%&\'*+~\/^`|{}=]+(?:\.[-\w!\#\$%&\'*+~\/^`|{}=]+)*"  // local-part
            ."@$utf_domain"                                                 // domain-part
            ."(\?[$url1$url2]+)?"                                           // e.g. ?subject=test...
            .")/";
    }

    /**
     * Add a string to the internal list
     *
     * @param string String value 
     * @return int Index of value for retrieval
     */
    public function add($str)
    {
        $i = count($this->values);
        $this->values[$i] = $str;
        return $i;
    }

    /**
     * Build replacement string
     */
    public function get_replacement($i)
    {
        return '##str_replacement['.$i.']##';
    }

    /**
     * Callback function used to build HTML links around URL strings
     *
     * @param array Matches result from preg_replace_callback
     * @return int Index of saved string value
     */
    public function link_callback($matches)
    {
        $i = -1;
        $scheme = strtolower($matches[1]);

        if (preg_match('!^(http|ftp|file)s?://!i', $scheme)) {
            $url = $matches[1] . $matches[2];
        }
        else if (preg_match('/^(\W*)(www\.)$/i', $matches[1], $m)) {
            $url        = $m[2] . $matches[2];
            $url_prefix = 'https://';
            $prefix     = $m[1];
        }

        if ($url) {
            $suffix = $this->parse_url_brackets($url);
            $i = $this->add(html::a(array(
                'href'   => $url_prefix . $url,
                'target' => '_blank'
            ), rcube::Q($url)) . $suffix);
        }

        // Return valid link for recognized schemes, otherwise
        // return the unmodified string for unrecognized schemes.
        return $i >= 0 ? $prefix . $this->get_replacement($i) : $matches[0];
    }

    /**
     * Callback function used to build mailto: links around e-mail strings
     *
     * @param array Matches result from preg_replace_callback
     * @return int Index of saved string value
     */
    public function mailto_callback($matches)
    {
        $href   = $matches[1];
        $suffix = $this->parse_url_brackets($href);
        $i = $this->add(html::a('mailto:' . $href, rcube::Q($href)) . $suffix);

        return $i >= 0 ? $this->get_replacement($i) : '';
    }

    /**
     * Look up the index from the preg_replace matches array
     * and return the substitution value.
     *
     * @param array Matches result from preg_replace_callback
     * @return string Value at index $matches[1]
     */
    public function replace_callback($matches)
    {
        return $this->values[$matches[1]];
    }

    /**
     * Replace all defined (link|mailto) patterns with replacement string
     *
     * @param string $str Text
     *
     * @return string Text
     */
    public function replace($str)
    {
        // search for patterns like links and e-mail addresses
        $str = preg_replace_callback($this->link_pattern, array($this, 'link_callback'), $str);
        $str = preg_replace_callback($this->mailto_pattern, array($this, 'mailto_callback'), $str);

        return $str;
    }

    /**
     * Replace substituted strings with original values
     */
    public function resolve($str)
    {
        return preg_replace_callback(self::$pattern, array($this, 'replace_callback'), $str);
    }

    /**
     * Fixes bracket characters in URL handling
     */
    public static function parse_url_brackets(&$url)
    {
        // #1487672: special handling of square brackets,
        // URL regexp allows [] characters in URL, for example:
        // "https://example.com/?a[b]=c". However we need to handle
        // properly situation when a bracket is placed at the end
        // of the link e.g. "[https://example.com]"
        // Yes, this is not perfect handles correctly only paired characters
        // but it should work for common cases

        if (preg_match('/(\\[|\\])/', $url)) {
            $in = false;
            for ($i=0, $len=strlen($url); $i<$len; $i++) {
                if ($url[$i] == '[') {
                    if ($in)
                        break;
                    $in = true;
                }
                else if ($url[$i] == ']') {
                    if (!$in)
                        break;
                    $in = false;
                }
            }

            if ($i < $len) {
                $suffix = substr($url, $i);
                $url    = substr($url, 0, $i);
            }
        }

        // Do the same for parentheses
        if (preg_match('/(\\(|\\))/', $url)) {
            $in = false;
            for ($i=0, $len=strlen($url); $i<$len; $i++) {
                if ($url[$i] == '(') {
                    if ($in)
                        break;
                    $in = true;
                }
                else if ($url[$i] == ')') {
                    if (!$in)
                        break;
                    $in = false;
                }
            }

            if ($i < $len) {
                $suffix = substr($url, $i);
                $url    = substr($url, 0, $i);
            }
        }

        return $suffix;
    }
}
