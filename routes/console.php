<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('escolinha:lembretes')->everyTenMinutes()->withoutOverlapping();
