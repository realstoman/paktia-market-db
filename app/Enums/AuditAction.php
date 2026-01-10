<?php

namespace App\Enums;

enum AuditAction: string
{
    case CREATED = 'created';
    case UPDATED = 'updated';
    case DELETED = 'deleted';
    case APPROVED = 'approved';
    case CANCELLED = 'cancelled';
    case LOGIN = 'login';
    case LOGOUT = 'logout';
}
