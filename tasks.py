import logging
import time
import sys
from time import sleep

from bnorg import config
from bnorg.helpers import ui
from invoke import task
from plumbum import local
from os import system

# * Config
TEST_REGEX = "simple parse"

@task
def t(ctx):
    system(f'./node_modules/.bin/jest -b --watch --notify')


@task
def s(ctx):
    ui.open_in_terminal('yarn start', 'bundler')


@task
def fast_command_1(ctx):
    # ui.open_in_terminal('inv reload', window_name='terminal window')
    ui.send_message_to_user('app reloaded')


@task
def fast_command_2(ctx):
    ui.send_message_to_user('project fast command #2')


@task
def reset_db(ctx):
    files = ["default.realm", "default.realm.lock"]
    for file in files:
        (local.cwd / file).delete()
    ui.send_message_to_user('Removed Realm database.')
