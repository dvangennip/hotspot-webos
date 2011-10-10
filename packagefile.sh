#!/bin/sh

# Makefile for nl.sinds1984.hotspot
# Helps to set up a custom packaging process

APPID=nl.sinds1984.hotspot

# package everything
palm-package --outdir=bin app_src app_package app_service

# add script files to package
ar q bin/${APPID}*.ipk pmPostInstall.script
ar q bin/${APPID}*.ipk pmPreRemove.script
