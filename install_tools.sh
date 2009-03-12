#! /bin/sh

wget ftp://ftp.mozilla.org/pub/mozilla.org/js/rhino1_7R1.zip
unzip rhino1_7R1.zip
rm rhino1_7R1.zip

mkdir jsspec
pushd jsspec
wget http://jsspec.googlecode.com/files/jsspec2_20081207.tar.gz
tar xzf jsspec2_20081207.tar.gz
rm jsspec2_20081207.tar.gz
popd

wget http://jslint4java.googlecode.com/files/jslint4java-1.2.1.zip
unzip jslint4java-1.2.1.zip
rm jslint4java-1.2.1.zip

sudo gem install webrick-webdav