#!/usr/bin/ruby
require 'rubygems'
require 'webrick'
require 'webrick/httpservlet/webdavhandler'

# Monkey patch REXML to always nil-indent. The indentation is broken in REXML
# on Ruby 1.8.6 and even when fixed it confuses OS-X.
module REXML
  module Node
    alias old_to_s to_s
    def to_s(indent=nil)
      old_to_s(nil)
    end
  end
end

# http://blade.nagaokaut.ac.jp/cgi-bin/scat.rb/ruby/ruby-talk/223386
# http://gmarrone.objectblues.net/cgi-bin/wiki/WebDAV_-_Linux_server%2c_Mac_OS_X_client
module WEBrick
  module HTTPServlet
    class WebDAVHandlerVersion2 < WebDAVHandler
      def do_OPTIONS(req, res)
        super
        res["DAV"] = "1,2"
      end

      def do_LOCK(req, res)
        res.body << "<XXX-#{Time.now.to_s}/>"
      end
    end
  end
end

log = WEBrick::Log.new
log.level = WEBrick::Log::DEBUG if $DEBUG
serv = WEBrick::HTTPServer.new({:Port => 10080, :Logger => log})
serv.mount("/", WEBrick::HTTPServlet::WebDAVHandlerVersion2, ARGV[0] || Dir.pwd)
trap(:INT){ serv.shutdown }
serv.start
