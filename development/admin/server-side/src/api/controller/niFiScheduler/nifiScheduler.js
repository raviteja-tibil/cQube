const router = require('express').Router();
const { logger } = require('../../lib/logger');
const auth = require('../../middleware/check-auth');
const axios = require('axios');
var schedule = require('node-schedule');

router.get('/getProcessorId', auth.authController, async (req, res) => {
    try {
        logger.info('--- get nifi processor group id api ---')
        let url = `${process.env.NIFI_URL}/process-groups/root`
        let getGroupId = await axios.get(url);
        logger.info('--- get nifi processor group id api response sent ---')
        res.send({ processorId: getGroupId.data.id })
    } catch (e) {
        logger.error(`Error :: ${e}`);
        res.status(500).json({ errMsg: "Internal error. Please try again!!" });
    }
})

router.get('/getProcessorDetails/:id', auth.authController, async (req, res) => {
    try {
        logger.info('--- get nifi processor group details api ---');
        let groupId = req.params.id
        let url = `${process.env.NIFI_URL}/flow/process-groups/${groupId}`
        let getGroupDetails = await axios.get(url);

        var groupObj = []
        let processorGroups = process.env.NIFI_PROCESSORS.split(',')
        processorGroups.forEach(groupName => {
            getGroupDetails.data.processGroupFlow.flow.processGroups.forEach(result => {
                if (result.component.name == groupName) {
                    let groupNames = {
                        id: result.id,
                        name: result.component.name,
                        state: 'RUNNING'
                    };
                    groupObj.push(groupNames)
                }
            });
        })
        logger.info('--- get nifi processor group details api response sent ---')
        res.send(groupObj)
    } catch (e) {
        logger.error(`Error :: ${e}`);
        res.status(500).json({ errMsg: "Internal error. Please try again!!" });
    }
});

router.post('/scheduleProcessor/:id', auth.authController, async (req, res) => {
    try {
        logger.info('--- schedule processor api ---')
        let groupId = req.params.id
        let state = req.body.state
        let timeToSchedule = req.body.time
        timeToSchedule = timeToSchedule.split(':')
        let hours = parseInt(timeToSchedule[0])
        let mins = parseInt(timeToSchedule[1])
        let timeToStop = req.body.stopTime
        timeToStop = hours + timeToStop

        if (timeToStop >= 24) {
            timeToStop = timeToStop % 24;
            timeToStop = timeToStop < 0 ? 24 + timeToStop : +timeToStop;
        }
        let url = `${process.env.NIFI_URL}/flow/process-groups/${groupId}`

        var job = await schedule.scheduledJobs[groupId];
        if (job != undefined) {
            job.cancel();
            await schedule.scheduleJob(groupId, `${mins}  ${hours} * * *`, async function () {
                // logger.info(`re schedule processor ${groupId} for new time ::::::: ${hours} : ${mins}`);
                logger.info(`--- ${groupId} - Nifi processor group re-scheduling started ---`);
                let response = await startFun()
                logger.info(JSON.stringify(response))
                logger.info(`--- ${groupId} - Nifi processor group re-scheduling completed ---`);
            });
            await schedule.scheduleJob(groupId, `${mins} ${timeToStop} * * *`, async function () {
                logger.info(`--- ${groupId} - Nifi processor group re-scheduling stopping initiated ---`);
                let response = await stopFun()
                logger.info(JSON.stringify(response))
                logger.info(`--- ${groupId} - Nifi processor group re-scheduling stopping completed ---`);
            });
        } else {
            await schedule.scheduleJob(groupId, `${mins}  ${hours} * * *`, async function () {
                // logger.info(`schedule processor ${groupId} for default time ::::::: ${hours} : ${mins}`);
                logger.info(`--- ${groupId} - Nifi processor group scheduling started ---`);
                let response = await startFun()
                logger.info(JSON.stringify(response))
                logger.info(`--- ${groupId} - Nifi processor group scheduling completed ---`);
            });
            await schedule.scheduleJob(groupId, `${mins} ${timeToStop} * * *`, async function () {
                // logger.info(`schedule processor ${groupId} stop time ::::::: ${timeToStop} : ${mins}`);
                logger.info(`--- ${groupId} - Nifi processor group scheduling stopping initiated ---`);
                let response = await stopFun()
                logger.info(JSON.stringify(response))
                logger.info(`--- ${groupId} - Nifi processor group scheduling stopping completed ---`);
            });
        }
        const startFun = () => {
            return new Promise(async (resolve, reject) => {
                try {
                    let result = await axios.put(url, {
                        id: groupId,
                        state: state,
                        disconnectedNodeAcknowledged: false
                    });
                    resolve(result.data)
                } catch (e) {
                    reject(e)
                }
            })
        }
        const stopFun = () => {
            return new Promise(async (resolve, reject) => {
                try {
                    let result = await axios.put(url, {
                        id: groupId,
                        state: 'STOPPED',
                        disconnectedNodeAcknowledged: false
                    });
                    resolve(result.data)
                } catch (e) {
                    reject(e)
                }
            })
        }
        logger.info('--- schedule processor api response sent ---')
        res.send({ msg: `Job rescheduled successfully at ${req.body.time} every day` })
    } catch (e) {
        logger.error(`Error :: ${e}`);
        res.status(500).json({ errMsg: "Internal error. Please try again!!" });
    }
})

router.post('/scheduleNiFiProcessor/:id', async (req, res) => {
    try {
        logger.info('---default schedule nifi processor api ---')
        let groupId = req.params.id
        let state = req.body.state
        let timeToSchedule = req.body.time
        timeToSchedule = timeToSchedule.split(':')
        let hours = parseInt(timeToSchedule[0])
        let mins = parseInt(timeToSchedule[1])
        let timeToStop = req.body.stopTime
        timeToStop = hours + timeToStop

        if (timeToStop >= 24) {
            timeToStop = timeToStop % 24;
            timeToStop = timeToStop < 0 ? 24 + timeToStop : +timeToStop;
        }
        let url = `${process.env.NIFI_URL}/flow/process-groups/${groupId}`

        var job = await schedule.scheduledJobs[groupId];
        if (job != undefined) {
            job.cancel();
            await schedule.scheduleJob(groupId, `${mins}  ${hours} * * *`, async function () {
                // logger.info(`re schedule processor ${groupId} for new time ::::::: ${hours} : ${mins}`);
                logger.info(`--- ${groupId} - Nifi processor group re-scheduling started ---`);
                let response = await startFun()
                logger.info(JSON.stringify(response))
                logger.info(`--- ${groupId} - Nifi processor group re-scheduling completed ---`);
            });
            await schedule.scheduleJob(groupId, `${mins} ${timeToStop} * * *`, async function () {
                logger.info(`--- ${groupId} - Nifi processor group re-scheduling stopping initiated ---`);
                let response = await stopFun()
                logger.info(JSON.stringify(response))
                logger.info(`--- ${groupId} - Nifi processor group re-scheduling stopping completed ---`);
            });
        } else {
            await schedule.scheduleJob(groupId, `${mins}  ${hours} * * *`, async function () {
                // logger.info(`schedule processor ${groupId} for default time ::::::: ${hours} : ${mins}`);
                logger.info(`--- ${groupId} - Nifi processor group scheduling started ---`);
                let response = await startFun()
                logger.info(JSON.stringify(response))
                logger.info(`--- ${groupId} - Nifi processor group scheduling completed ---`);
            });
            await schedule.scheduleJob(groupId, `${mins} ${timeToStop} * * *`, async function () {
                // logger.info(`schedule processor ${groupId} stop time ::::::: ${timeToStop} : ${mins}`);
                logger.info(`--- ${groupId} - Nifi processor group scheduling stopping initiated ---`);
                let response = await stopFun()
                logger.info(JSON.stringify(response))
                logger.info(`--- ${groupId} - Nifi processor group scheduling stopping completed ---`);
            });
        }
        const startFun = () => {
            return new Promise(async (resolve, reject) => {
                try {
                    let result = await axios.put(url, {
                        id: groupId,
                        state: state,
                        disconnectedNodeAcknowledged: false
                    });
                    resolve(result.data)
                } catch (e) {
                    reject(e)
                }
            })
        }
        const stopFun = () => {
            return new Promise(async (resolve, reject) => {
                try {
                    let result = await axios.put(url, {
                        id: groupId,
                        state: 'STOPPED',
                        disconnectedNodeAcknowledged: false
                    });
                    resolve(result.data)
                } catch (e) {
                    reject(e)
                }
            })
        }
        logger.info('---default schedule nifi processor api response sent ---')
        res.send({ msg: `Job rescheduled successfully at ${req.body.time} every day` })
    } catch (e) {
        logger.error(`Error :: ${e}`);
        res.status(500).json({ errMsg: "Internal error. Please try again!!" });
    }
})


module.exports = router;