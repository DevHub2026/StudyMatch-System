<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SystemConfiguration;
use Illuminate\Http\Request;

class AdminSystemConfigController extends Controller
{
    public function index()
    {
        $configs = SystemConfiguration::orderBy('group')->orderBy('key')->get()
            ->groupBy('group');

        return response()->json(['configs' => $configs]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'configs'             => 'required|array',
            'configs.*.key'       => 'required|string',
            'configs.*.value'     => 'nullable|string',
        ]);

        foreach ($request->configs as $item) {
            SystemConfiguration::set($item['key'], $item['value']);
        }

        return response()->json(['message' => 'Configuration saved.']);
    }

    public function updateKey(Request $request, string $key)
    {
        $request->validate(['value' => 'nullable|string']);

        SystemConfiguration::set($key, $request->value);

        return response()->json(['message' => "Config '{$key}' updated."]);
    }
}
