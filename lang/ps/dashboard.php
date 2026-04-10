<?php

return [
    'inventory' => [
        'usable' => 'د کارونې وړ',
        'fixed' => 'ثابت',
        'other' => 'نور',
        'unassigned' => 'نه دي ټاکل شوي',
    ],
    'attention' => [
        'critical_projection_branches_title' => 'د وړاندوینه بحراني څانګې',
        'critical_projection_branches_detail' => 'د :count څانګو وړاندوینه بیاکتنې ته اړتیا لري.',
        'projection_warnings_title' => 'د وړاندوینه خبرتیاوې',
        'projection_warnings_detail' => ':count څانګې زاړه یا خبرداري لرونکي وړاندوینهونه لري.',
        'out_of_stock_title' => 'له موجودۍ وتلي توکي',
        'out_of_stock_detail' => ':count توکي دا مهال نه شته.',
        'low_stock_title' => 'کم موجودي توکي',
        'low_stock_detail' => ':count توکي د موجودۍ له ټاکلي حد څخه ښکته دي.',
        'cancellation_rate_title' => 'د لغوه کېدو کچه لوړه شوې',
        'cancellation_rate_detail' => 'نن لغوه شوي امرونه :rate% ته رسېدلي دي.',
        'vendor_balances_title' => 'د عرضه کوونکو پاتې بیلانسونه',
        'vendor_balances_detail' => 'د عرضه کوونکو پاتې پورونه ټولټال :amount افغانۍ دي.',
    ],
    'notes' => [
        'net_profit_without_cogs' => 'خالصه ګټه = خرڅلاو - لګښتونه تر هغه چې د موجودۍ د لګښت ثبتونه فعال شي.',
        'net_profit_with_cogs' => 'خالصه ګټه = ناخالصه ګټه - لګښتونه، د موجودۍ د ثبت شوو لګښتي خوځښتونو پر بنسټ.',
        'expenses' => 'لګښتونه = د ټولو ثبت شوو لګښتونو مجموعه.',
        'cash_position' => 'نغدي وضعیت = نغدي خرڅلاو - نغدي لګښتونه + تایید شوي نغدي خوځښتونه.',
    ],
    'projection' => [
        'branch_current' => 'وړاندوینه تازه دی.',
        'branch_missing' => 'د سرچینې وروستی فعالیت شته خو هېڅ وړاندوینه نه دی ثبت شوی.',
        'branch_critical' => 'وړاندوینه د وروستي سرچینې فعالیت څخه په بحراني ډول شاته دی.',
        'branch_warning' => 'وړاندوینه د وروستي سرچینې فعالیت څخه شاته دی.',
        'branch_unavailable' => 'د دې څانګې لپاره لا تر اوسه د وړاندوینه معلومات نه دي ثبت شوي.',
        'overall_critical' => 'یو یا څو څانګې د وروستي سرچینې فعالیت څخه په څرګند ډول شاته دي.',
        'overall_warning' => 'د ځینو څانګو لپاره د وړاندوینه تازه کول ځنډېدلي دي.',
        'overall_unavailable' => 'د وړاندوینه معلومات لا نه دي جوړ شوي.',
        'overall_healthy' => 'د فعالو څانګو لپاره د وړاندوینه معلومات تازه دي.',
    ],
];
