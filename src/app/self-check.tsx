import { View } from 'react-native';

import { runSelfCheck } from '@/core/self-check';
import { Card, Screen, Txt } from '@/ui/components';
import { t } from '@/ui/strings';

type Hermes = { getRuntimeProperties?: () => Record<string, unknown> };
const hermes = (globalThis as { HermesInternal?: Hermes }).HermesInternal;
const engine = hermes ? `Hermes ${String(hermes.getRuntimeProperties?.()['OSS Release Version'] ?? '')}`.trim() : 'Not Hermes';

/** Runs the time-zone cases on this phone's own JavaScript engine. Development and staging only. */
export default function SelfCheckScreen() {
  const results = runSelfCheck();
  const failed = results.filter((r) => !r.pass).length;
  return (
    <Screen edges={['bottom']}>
      <Card highlight>
        <Txt bold tone={failed ? 'danger' : 'ok'} testID="self-check-result">
          {failed ? t.selfCheck.someFail(failed, results.length) : t.selfCheck.allPass(results.length)}
        </Txt>
        <Txt size={14} tone="muted">
          {t.selfCheck.engine}: {engine}
        </Txt>
      </Card>
      <Card>
        {results.map((r) => (
          <View key={r.name}>
            <Txt tone={r.pass ? 'ok' : 'danger'}>
              {r.pass ? '✓' : '✗'} {r.name}
            </Txt>
            {!r.pass && (
              <Txt size={14} tone="muted">
                {t.selfCheck.expected}: {r.expected} · {t.selfCheck.got}: {r.got}
              </Txt>
            )}
          </View>
        ))}
      </Card>
    </Screen>
  );
}
