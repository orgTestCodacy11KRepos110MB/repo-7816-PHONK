/* Copyright 2019 The TensorFlow Authors. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==============================================================================*/

package org.tensorflow.lite.examples.transfer.api;

import java.io.Closeable;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.Map;
import java.util.TreeMap;

class LiteInitializeModel implements Closeable {
  private static final int FLOAT_BYTES = 4;

  private final LiteModelWrapper modelWrapper;

  LiteInitializeModel(LiteModelWrapper modelWrapper) {
    this.modelWrapper = modelWrapper;
  }

  /**
   * Fills the model parameter buffers with initial values generated by the initializer model.
   *
   * @param modelParameters where to store the model outputs.
   */
  void initializeParameters(ByteBuffer[] modelParameters) {
    ByteBuffer zero = ByteBuffer.allocateDirect(FLOAT_BYTES);
    zero.order(ByteOrder.nativeOrder());
    zero.putFloat(0, 0.f);

    Map<Integer, Object> outputs = new TreeMap<>();
    for (int paramIdx = 0; paramIdx < modelParameters.length; paramIdx++) {
      outputs.put(paramIdx, modelParameters[paramIdx]);
    }

    modelWrapper.getInterpreter().runForMultipleInputsOutputs(new Object[] {zero}, outputs);
    for (ByteBuffer buffer : modelParameters) {
      buffer.rewind();
    }
  }

  @Override
  public void close() {
    modelWrapper.close();
  }
}
