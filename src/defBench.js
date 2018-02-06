function fib(num) 
{
    if (num <= 2) return 1;
    return fib(num - 1) + fib(num - 2);
}

let arr = new Array(100000);
arr.fill(1);

export default [
    {
        name: 'fib(5)',
        fn() 
        {
            fib(5);
        }
    },
    {
        name: 'for_loop',
        fn: [
            {
                name: 'normal for loop. i < arr.length',
                fn() 
                {
                    for (let i = 0; i < arr.length; i++) arr[i] + 1;
                }
            },
            {
                name: 'normal for loop. cache arr.length',
                fn() 
                {
                    for (let i = 0, len = arr.length; i < len; i++) arr[i] + 1;
                }
            },
            {
                name: 'native. forEach',
                fn() 
                {
                    arr.forEach(function (item) 
                    {
                        item + 1;
                    });
                }
            }
        ]
    }
];