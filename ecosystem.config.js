module.exports = {
    apps: [
        {
            name: 'web',
            script: 'npm',
            args: 'start',
            env: {
                NODE_ENV: 'production',
            },
        },
        {
            name: 'recorder',
            script: 'npx',
            args: 'tsx recorder-service.ts',
            env: {
                NODE_ENV: 'production',
            },
        },
    ],
};
