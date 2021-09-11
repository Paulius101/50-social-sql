const mysql = require('mysql2/promise');

const app = {}

app.init = async () => {
    // prisijungti prie duomenu bazes
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        database: 'social',
    });

    let sql = '';
    let rows = [];

    // LOGIC BELOW

    function firstCapital(str) {
        return str[0].toUpperCase() + str.slice(1);
    }

    function formatDate(time) {
        const d = new Date(time);
        const dformat = [d.getFullYear(), d.getMonth() + 1,
        d.getDate(),].join('-') + ' ' +
            [d.getHours(),
            d.getMinutes(),
            d.getSeconds()].join(':');
        return dformat
    }



    //**1** _Registruotu vartotoju sarasas, isrikiuotas nuo naujausio link 
    //seniausio. Reikia nurodyti varda, post'u kieki, komentaru kieki ir like'u kieki
    sql = 'SELECT `users`.`id`, `firstname`, \
    COUNT(DISTINCT `posts`.`id`) as posts, COUNT(DISTINCT `comments`.`id`) as comments, COUNT(DISTINCT `posts_likes`.`id`) as likes\
    FROM `users`\
    LEFT JOIN `posts`\
    ON `posts`.`user_id` = `users`.`id`\
    LEFT JOIN `comments`\
    ON `comments`.`user_id` = `users`.`id`\
    LEFT JOIN `posts_likes`\
    ON `posts_likes`.`user_id` = `users`.`id`\
    GROUP BY `users`.`id`\
    ORDER BY `register_date` DESC';
    [rows] = await connection.execute(sql);

    console.log(`Users: `);
    let i = 0;
    for (let item of rows) {
        console.log(`${++i}. ${firstCapital(item.firstname)}: posts (${item.posts}), comments (${item.comments}), likes (${item.likes});`);
    }

    //2
    sql = 'SELECT `users`.`firstname`, `posts`.`text`, `posts`.`date` \
        FROM `posts` \
        LEFT JOIN `users` \
            ON `users`.`id` = `posts`.`user_id` \
        LEFT JOIN `friends` \
            ON `friends`.`friend_id` = `posts`.`user_id` \
        WHERE `friends`.`user_id` = 2\
        ORDER BY `date` DESC';

    [rows] = await connection.execute(sql);
    console.log(rows);

    //3
    // sql = 'SELECT `posts`.`text`, `comments`.`text`, ';

    // [rows] = await connection.execute(sql);
    // console.log(rows);

    //4
    sql = 'SELECT `users`.`firstname`,\
    `friends`.`user_id`,\
    `friends`.`friend_id`,\
       ( \
        SELECT `users`.`firstname` \
        FROM `users` \
        WHERE `users`.`id` = `friends`.`friend_id` \
    ) as friendName, \
`friends`.`follow_date`\
    FROM `friends`\
    LEFT JOIN `users`\
    ON `friends`.`user_id` = `users`.`id`\
    ORDER BY `users`.`firstname` DESC';
    [rows] = await connection.execute(sql);
    let j = 0;
    console.log(rows);
    console.log(`User's relationships:`);
    for (const entry of rows) {
        console.log(`${++j}. ${firstCapital(entry.firstname)} is following ${firstCapital(entry.friendName)} (since ${formatDate(entry.follow_date)})`);
    }
}


app.init();

module.exports = app;