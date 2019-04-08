# Pivotal Tracker Status Checks

## Introduction
Pivotal Tracker Status Checks is a [Github App](https://developer.github.com/apps/) that listens for webhooks from [Pivotal Tracker](https://www.pivotaltracker.com/) stories. It then checks the pull requests attached to the story and adds a Github Status Check to each pull request with the status of the story.

## Environment Variables
`PTSU_APP_ID` - Github App App ID

`PTSU_PRIVATE_KEY` - Github App Private Key String

`PTSU_INSTALL_LOGIN` - Github App Installation Login

`PTSU_PIVOTAL_PROJECT_ID` - Pivotal Tracker Project ID

`PTSU_PIVOTAL_TOKEN` - Pivotal Tracker API Token
