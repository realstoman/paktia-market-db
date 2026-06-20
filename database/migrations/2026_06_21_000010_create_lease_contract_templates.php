<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contract_templates', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('property_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('contract_title');
            $table->text('intro_text')->nullable();
            $table->string('logo_path')->nullable();
            $table->string('landlord_organization')->default('پکتیاوال گروپ');
            $table->string('representative_name');
            $table->string('representative_position')->default('رئیس اجرائیه');
            $table->string('representative_contact')->nullable();
            $table->string('landlord_signature_label')->default('امضاء و مهر جانب مالک');
            $table->string('tenant_signature_label')->default('امضاء و نشان انگشت مستأجر');
            $table->string('witness_signature_label')->default('امضاء شاهد');
            $table->text('footer_text')->nullable();
            $table->boolean('is_default')->default(false)->index();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
        });

        Schema::create('contract_template_articles', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('contract_template_id')->constrained()->cascadeOnDelete();
            $table->string('article_number', 30);
            $table->string('title');
            $table->text('body');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
            $table->index(['contract_template_id', 'sort_order'], 'contract_articles_order_idx');
        });

        Schema::create('lease_contract_documents', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('lease_id')->constrained()->cascadeOnDelete();
            $table->foreignId('contract_template_id')->nullable()->constrained()->nullOnDelete();
            $table->string('path');
            $table->string('original_name');
            $table->string('mime_type', 100)->nullable();
            $table->unsignedBigInteger('size_bytes')->nullable();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('signed_at')->nullable();
            $table->timestamps();
            $table->index(['lease_id', 'created_at']);
        });

        $now = now();
        $templateId = DB::table('contract_templates')->insertGetId([
            'name' => 'قرارداد عمومی کرایه',
            'contract_title' => 'قرارداد اجاره جایداد تجارتی و رهایشی',
            'intro_text' => 'این قرارداد میان :landlord_organization، به نمایندگی :landlord_name (:landlord_position)، و :tenant_name به حیث مستأجر، با رضایت کامل طرفین منعقد می‌گردد.',
            'landlord_organization' => 'پکتیاوال گروپ',
            'representative_name' => 'نام رئیس اجرائیه',
            'representative_position' => 'رئیس اجرائیه',
            'landlord_signature_label' => 'امضاء و مهر جانب مالک',
            'tenant_signature_label' => 'امضاء و نشان انگشت مستأجر',
            'witness_signature_label' => 'امضاء شاهد',
            'footer_text' => 'این قرارداد در دو نسخه با اعتبار یکسان ترتیب و پس از امضاء و مهر طرفین نافذ می‌گردد.',
            'is_default' => true,
            'is_active' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $articles = [
            ['ماده اول', 'موضوع قرارداد', 'موضوع این قرارداد، اجاره :space در :property_name برای استفاده قانونی مستأجر می‌باشد.'],
            ['ماده دوم', 'مدت قرارداد', 'مدت قرارداد از تاریخ :start_date آغاز و تا تاریخ :end_date ادامه دارد. تمدید قرارداد تنها با موافقت کتبی طرفین ممکن است.'],
            ['ماده سوم', 'مبلغ و شیوه پرداخت', 'مبلغ کرایه :rent_amount :currency به صورت :payment_frequency تعیین گردیده و مستأجر مکلف است آن را در موعد تعیین‌شده پرداخت نماید.'],
            ['ماده چهارم', 'تعهدات مستأجر', 'مستأجر مکلف است از جایداد به‌صورت مسئولانه استفاده نموده، قوانین نافذه، نظم مارکیت و شرایط این قرارداد را رعایت نماید. انتقال جایداد به شخص دیگر بدون اجازه کتبی مالک ممنوع است.'],
            ['ماده پنجم', 'تعهدات مالک', 'مالک مکلف است جایداد موضوع قرارداد را در مدت قرارداد برای استفاده توافق‌شده در اختیار مستأجر قرار دهد و حقوق قانونی وی را رعایت نماید.'],
            ['ماده ششم', 'فسخ و تخلیه', 'در صورت عدم پرداخت کرایه، تخلف از شرایط قرارداد یا استفاده غیرقانونی، مالک حق فسخ قرارداد و مطالبه تخلیه جایداد را مطابق قانون دارد.'],
            ['ماده هفتم', 'حل اختلاف', 'اختلافات ابتدا از طریق مذاکره حل می‌گردد؛ در صورت عدم توافق، موضوع مطابق قوانین نافذه افغانستان به مراجع ذی‌صلاح سپرده می‌شود.'],
            ['ماده هشتم', 'نسخ و اعتبار قرارداد', 'این قرارداد با شماره :contract_number در دو نسخه ترتیب شده و هر نسخه پس از امضاء طرفین اعتبار یکسان دارد.'],
        ];

        foreach ($articles as $index => [$number, $title, $body]) {
            DB::table('contract_template_articles')->insert([
                'contract_template_id' => $templateId,
                'article_number' => $number,
                'title' => $title,
                'body' => $body,
                'sort_order' => $index + 1,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('lease_contract_documents');
        Schema::dropIfExists('contract_template_articles');
        Schema::dropIfExists('contract_templates');
    }
};
